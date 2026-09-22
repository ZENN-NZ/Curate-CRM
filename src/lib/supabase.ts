import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);
const envAnonKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

// Allow reading from localStorage if user configured it in-app
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('curate_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('curate_supabase_key') : null;

const supabaseUrl = envUrl || storedUrl;
const supabaseAnonKey = envAnonKey || storedKey;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = supabaseInstance;

export function isSupabaseConfigured(): boolean {
  return !!supabaseInstance;
}

export function configureSupabase(url: string, anonKey: string): boolean {
  try {
    const client = createClient(url, anonKey);
    localStorage.setItem('curate_supabase_url', url);
    localStorage.setItem('curate_supabase_key', anonKey);
    supabaseInstance = client;
    return true;
  } catch (err) {
    console.error('Invalid Supabase configuration:', err);
    return false;
  }
}
