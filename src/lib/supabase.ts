import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnvVar(name: string): string | undefined {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    if ((import.meta as any).env[name]) return (import.meta as any).env[name];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[name]) return process.env[name];
  }
  return undefined;
}

const envUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const envAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('curate_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('curate_supabase_key') : null;

const initialUrl = envUrl || storedUrl || '';
const initialAnonKey = envAnonKey || storedKey || '';

export let supabase: SupabaseClient | null = null;

function initClient(url: string, key: string): SupabaseClient | null {
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

if (initialUrl && initialAnonKey) {
  supabase = initClient(initialUrl, initialAnonKey);
}

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

export function getSupabase(): SupabaseClient | null {
  return supabase;
}

export type SupabaseConfigInfo = {
  url: string;
  anonKey: string;
  source: 'vercel_env' | 'localStorage' | 'none';
  isConfigured: boolean;
};

export function getSupabaseConfig(): SupabaseConfigInfo {
  const isEnv = !!(envUrl && envAnonKey);
  const isStored = !!(storedUrl && storedKey);
  
  const activeUrl = envUrl || storedUrl || '';
  const activeKey = envAnonKey || storedKey || '';

  return {
    url: activeUrl,
    anonKey: activeKey,
    source: isEnv ? 'vercel_env' : isStored ? 'localStorage' : 'none',
    isConfigured: !!(activeUrl && activeKey && supabase),
  };
}

export function configureSupabase(url: string, anonKey: string): boolean {
  try {
    const client = initClient(url, anonKey);
    if (!client) return false;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('curate_supabase_url', url);
      localStorage.setItem('curate_supabase_key', anonKey);
    }
    supabase = client;
    return true;
  } catch (err) {
    console.error('Invalid Supabase configuration:', err);
    return false;
  }
}

export type SupabaseHealthResult = {
  status: 'ready' | 'missing_tables' | 'auth_error' | 'unconfigured' | 'network_error';
  message: string;
  workspacesTable?: boolean;
  leadsTable?: boolean;
};

export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  if (!supabase) {
    return {
      status: 'unconfigured',
      message: 'Supabase URL or API key is not configured.',
    };
  }

  try {
    // 1. Probe workspaces table
    const { error: wsError } = await supabase.from('workspaces').select('id').limit(1);
    
    // Check for auth / key errors
    if (wsError && (wsError.code === 'PGRST301' || wsError.message?.toLowerCase().includes('jwt') || wsError.message?.toLowerCase().includes('apikey'))) {
      return {
        status: 'auth_error',
        message: 'Invalid Supabase API key or unauthorized project access.',
      };
    }

    const wsMissing = wsError && (wsError.code === '42P01' || wsError.message?.includes('does not exist'));

    // 2. Probe leads table
    const { error: leadError } = await supabase.from('leads').select('id').limit(1);
    const leadsMissing = leadError && (leadError.code === '42P01' || leadError.message?.includes('does not exist'));

    if (wsMissing || leadsMissing) {
      return {
        status: 'missing_tables',
        message: 'Connected to Supabase, but database tables (workspaces / leads) do not exist yet. Please run supabase/schema.sql in your Supabase SQL Editor.',
        workspacesTable: !wsMissing,
        leadsTable: !leadsMissing,
      };
    }

    if (wsError && !wsMissing) {
      return {
        status: 'network_error',
        message: wsError.message || 'Supabase query error',
      };
    }

    return {
      status: 'ready',
      message: 'Connected to Supabase. Database tables verified and active.',
      workspacesTable: true,
      leadsTable: true,
    };
  } catch (err: any) {
    return {
      status: 'network_error',
      message: err.message || 'Network error communicating with Supabase',
    };
  }
}

