import { localDb } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Workspace } from '../types';

const ACTIVE_WORKSPACE_KEY = 'curate_active_workspace_id';

function generatePasskey(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const workspaceService = {
  getActiveWorkspaceId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  },

  setActiveWorkspaceId(id: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    }
  },

  clearActiveWorkspace() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    }
  },

  async hasActiveWorkspace(): Promise<boolean> {
    const id = this.getActiveWorkspaceId();
    if (!id) return false;
    const ws = await localDb.workspaces.get(id);
    return !!ws;
  },

  async getActiveWorkspace(): Promise<Workspace | null> {
    const id = this.getActiveWorkspaceId();
    if (!id) return null;
    const ws = await localDb.workspaces.get(id);
    return ws || null;
  },

  async getAllWorkspaces(): Promise<Workspace[]> {
    return await localDb.workspaces.toArray();
  },

  /**
   * Send Email OTP code (using Supabase Auth or fallback simulation in local mode)
   */
  async sendEmailOtp(email: string): Promise<{ success: boolean; error?: string; isMock?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Email address is required' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
          },
        });
        if (error) return { success: false, error: error.message };
        return { success: true, isMock: false };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to dispatch verification code' };
      }
    } else {
      // Offline / Local development mode fallback
      console.info(`[Curate Local Mode] Verification code for ${cleanEmail} is: 123456`);
      return { success: true, isMock: true };
    }
  },

  /**
   * Verify the 6-digit Email OTP code
   */
  async verifyEmailOtp(email: string, token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanToken) {
      return { success: false, error: 'Verification code is required' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (error) return { success: false, error: error.message };
        return { success: true, userId: data.user?.id };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to verify code' };
      }
    } else {
      // Local fallback code
      if (cleanToken === '123456') {
        return { success: true, userId: 'local_user_' + Date.now().toString(36) };
      }
      return { success: false, error: 'Invalid verification code. (In Local Mode, enter 123456)' };
    }
  },

  async createWorkspace(name: string, ownerEmail?: string, ownerId?: string): Promise<Workspace> {
    const id = 'ws_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4);
    const passkey = generatePasskey();
    const ws: Workspace = {
      id,
      name: name.trim() || 'My Business CRM',
      passkey,
      ownerEmail: ownerEmail?.trim(),
      ownerId: ownerId,
      createdAt: new Date().toISOString(),
    };
    await localDb.workspaces.put(ws);
    this.setActiveWorkspaceId(id);

    // Sync workspace record to Supabase if connected
    if (isSupabaseConfigured() && supabase) {
      supabase.from('workspaces').upsert({
        id: ws.id,
        name: ws.name,
        passkey: ws.passkey,
        owner_email: ws.ownerEmail,
        owner_id: ws.ownerId,
        created_at: ws.createdAt,
      }).then(({ error }) => {
        if (error) console.warn('Workspace cloud registration error:', error);
      }, (err) => console.warn('Workspace cloud registration deferred:', err));
    }

    return ws;
  },

  async joinWorkspace(idOrLink: string, passkeyInput?: string, name?: string): Promise<Workspace> {
    let id = idOrLink.trim();
    let passkey = (passkeyInput || '').trim();

    // Smart link parser (if user pasted full URL or hash)
    if (id.includes('#sync=')) {
      const hashPart = id.split('#sync=')[1];
      const [parsedId, parsedKey] = decodeURIComponent(hashPart).split(':');
      if (parsedId) id = parsedId;
      if (parsedKey) passkey = parsedKey;
    }

    const existing = await localDb.workspaces.get(id);
    const ws: Workspace = {
      id,
      name: name || existing?.name || `Team ${id.substring(0, 8)}`,
      passkey: passkey || existing?.passkey || generatePasskey(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    await localDb.workspaces.put(ws);
    this.setActiveWorkspaceId(id);

    // Fetch initial workspace details from Supabase if connected
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.from('workspaces').select('*').eq('id', id).single();
        if (data) {
          ws.name = data.name;
          ws.ownerEmail = data.owner_email;
          await localDb.workspaces.put(ws);
        }
      } catch (_) {}
    }

    return ws;
  },

  getPairingLink(ws: Workspace): string {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/#sync=${encodeURIComponent(ws.id)}:${encodeURIComponent(ws.passkey)}`;
  },

  async checkAndApplyPairingHash(): Promise<Workspace | null> {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (hash && hash.startsWith('#sync=')) {
      const payload = decodeURIComponent(hash.replace('#sync=', ''));
      const [id, passkey] = payload.split(':');
      if (id && passkey) {
        const ws = await this.joinWorkspace(id, passkey);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return ws;
      }
    }
    return null;
  }
};
