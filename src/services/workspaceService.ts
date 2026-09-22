import { localDb } from '../lib/db';
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
  getActiveWorkspaceId(): string {
    if (typeof window === 'undefined') return 'default-workspace';
    let id = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    if (!id) {
      id = 'default-workspace';
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    }
    return id;
  },

  setActiveWorkspaceId(id: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    }
  },

  async getActiveWorkspace(): Promise<Workspace> {
    const id = this.getActiveWorkspaceId();
    let ws = await localDb.workspaces.get(id);
    if (!ws) {
      ws = {
        id,
        name: id === 'default-workspace' ? 'My Business CRM' : `Workspace ${id.substring(0, 6)}`,
        passkey: generatePasskey(),
        createdAt: new Date().toISOString(),
      };
      await localDb.workspaces.put(ws);
    }
    return ws;
  },

  async getAllWorkspaces(): Promise<Workspace[]> {
    const list = await localDb.workspaces.toArray();
    if (list.length === 0) {
      const active = await this.getActiveWorkspace();
      return [active];
    }
    return list;
  },

  async createWorkspace(name: string): Promise<Workspace> {
    const id = 'ws_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4);
    const passkey = generatePasskey();
    const ws: Workspace = {
      id,
      name: name.trim() || 'New Business',
      passkey,
      createdAt: new Date().toISOString(),
    };
    await localDb.workspaces.put(ws);
    this.setActiveWorkspaceId(id);
    return ws;
  },

  async joinWorkspace(id: string, passkey: string, name?: string): Promise<Workspace> {
    const existing = await localDb.workspaces.get(id);
    const ws: Workspace = {
      id,
      name: name || existing?.name || `Team ${id.substring(3, 9)}`,
      passkey: passkey.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    await localDb.workspaces.put(ws);
    this.setActiveWorkspaceId(id);
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
        // Clean URL to prevent history leak
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return ws;
      }
    }
    return null;
  }
};
