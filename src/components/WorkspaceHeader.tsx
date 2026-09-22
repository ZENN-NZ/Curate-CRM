import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Link2, 
  RefreshCw, 
  Check, 
  Copy, 
  Cloud, 
  CloudOff, 
  ShieldCheck, 
  Database, 
  X 
} from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { leadService } from '../services/leadService';
import { isSupabaseConfigured, configureSupabase } from '../lib/supabase';
import type { Workspace } from '../types';

interface WorkspaceHeaderProps {
  onWorkspaceChanged: () => void;
}

export function WorkspaceHeader({ onWorkspaceChanged }: WorkspaceHeaderProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [syncMessage, setSyncMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Form states
  const [newWsName, setNewWsName] = useState('');
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');

  const loadWorkspaces = async () => {
    const ws = await workspaceService.getActiveWorkspace();
    const all = await workspaceService.getAllWorkspaces();
    setActiveWorkspace(ws);
    setWorkspaces(all);
    setSyncStatus(isSupabaseConfigured() ? 'synced' : 'offline');
  };

  useEffect(() => {
    loadWorkspaces();
    // Auto-sync on connection recovery
    const handleOnline = () => triggerSync();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const triggerSync = async () => {
    if (!isSupabaseConfigured()) {
      setSyncStatus('offline');
      setSyncMessage('Local Mode (Device Only)');
      return;
    }
    setSyncStatus('syncing');
    setSyncMessage('Syncing with Supabase...');
    const res = await leadService.syncWithSupabase();
    if (res.status === 'synced') {
      setSyncStatus('synced');
      setSyncMessage(`Synced (+${res.pushedCount} up, +${res.pulledCount} down)`);
      onWorkspaceChanged();
    } else if (res.status === 'offline') {
      setSyncStatus('offline');
      setSyncMessage('Local Mode');
    } else {
      setSyncStatus('error');
      setSyncMessage(res.message || 'Sync failed');
    }
  };

  const handleSwitchWorkspace = (id: string) => {
    workspaceService.setActiveWorkspaceId(id);
    setIsMenuOpen(false);
    loadWorkspaces().then(() => {
      onWorkspaceChanged();
      triggerSync();
    });
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await workspaceService.createWorkspace(newWsName);
    setNewWsName('');
    setShowCreateModal(false);
    await loadWorkspaces();
    onWorkspaceChanged();
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (sbUrl && sbKey) {
      configureSupabase(sbUrl.trim(), sbKey.trim());
      setShowSupabaseModal(false);
      triggerSync();
    }
  };

  const pairingLink = activeWorkspace ? workspaceService.getPairingLink(activeWorkspace) : '';

  const copyPairingLink = () => {
    navigator.clipboard.writeText(pairingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 px-4 bg-zinc-900 text-zinc-100 rounded-xl mb-6 shadow-sm border border-zinc-800">
      {/* Workspace Switcher */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-2 text-sm font-semibold hover:text-white transition-colors bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/50"
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {activeWorkspace?.name || 'My Business CRM'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {isMenuOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 text-sm">
            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Switch Business Workspace
            </div>
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => handleSwitchWorkspace(ws.id)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-700 transition-colors ${
                  ws.id === activeWorkspace?.id ? 'text-blue-400 font-medium bg-zinc-700/40' : 'text-zinc-200'
                }`}
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspace?.id && <Check className="w-4 h-4 text-blue-400" />}
              </button>
            ))}
            <div className="border-t border-zinc-700 my-1" />
            <button
              onClick={() => { setIsMenuOpen(false); setShowCreateModal(true); }}
              className="w-full text-left px-3 py-2 text-blue-400 hover:bg-zinc-700 flex items-center space-x-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>New Business Workspace</span>
            </button>
          </div>
        )}
      </div>

      {/* Sync & Pair Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
        {/* Sync Status Badge */}
        <button
          onClick={triggerSync}
          title={syncMessage || 'Click to sync now'}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          ) : syncStatus === 'synced' ? (
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="hidden sm:inline">
            {syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Local Device'}
          </span>
        </button>

        {/* Pair Device Button */}
        <button
          onClick={() => setShowPairModal(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          title="Pair with office computer, home laptop, or mobile"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Pair Device</span>
        </button>

        {/* Supabase Config Button */}
        <button
          onClick={() => setShowSupabaseModal(true)}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Supabase Cloud Settings"
        >
          <Database className="w-4 h-4" />
        </button>
      </div>

      {/* Pair Another Device Modal */}
      {showPairModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Link2 className="w-5 h-5 mr-2 text-blue-400" />
                Pair Another Device
              </h3>
              <button onClick={() => setShowPairModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
              Use this link to access <strong>{activeWorkspace?.name}</strong> on your home laptop, office computer, or smartphone with zero passwords.
            </p>

            <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 mb-4">
              <label className="text-xs text-zinc-400 block mb-1">One-Click Pairing Link</label>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  readOnly
                  value={pairingLink}
                  className="bg-transparent text-xs text-blue-300 font-mono w-full truncate focus:outline-none"
                />
                <button
                  onClick={copyPairingLink}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/60 mb-5">
              <div className="text-xs text-zinc-400 mb-1">Workspace Key (For Manual Join)</div>
              <div className="font-mono text-sm font-bold text-zinc-200">
                {activeWorkspace?.passkey}
              </div>
            </div>

            <button
              onClick={() => setShowPairModal(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Create New Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-400" />
                Create New Business Workspace
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace}>
              <p className="text-sm text-zinc-400 mb-4">
                Each workspace provides an isolated database for a separate business or client team.
              </p>

              <div className="mb-5">
                <label className="text-xs text-zinc-300 font-medium block mb-1.5">Business / Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Realty, Northside Dental"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newWsName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Configuration Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Database className="w-5 h-5 mr-2 text-emerald-400" />
                Supabase Cloud Settings
              </h3>
              <button onClick={() => setShowSupabaseModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupabase}>
              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                Connect your Supabase project to enable background cloud backup, cross-device sync, and multi-user team collaboration.
              </p>

              <div className="mb-4">
                <label className="text-xs text-zinc-300 font-medium block mb-1">Project URL</label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mb-5">
                <label className="text-xs text-zinc-300 font-medium block mb-1">Anon / Public API Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!sbUrl || !sbKey}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
