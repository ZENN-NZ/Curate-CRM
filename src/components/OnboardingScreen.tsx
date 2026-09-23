import React, { useState } from 'react';
import { 
  Hexagon, 
  Building2, 
  Link2, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  LogIn, 
  Cloud, 
  Plus,
  RefreshCw 
} from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Workspace } from '../types';

interface OnboardingScreenProps {
  onWorkspaceReady: (ws: Workspace) => void;
}

export function OnboardingScreen({ onWorkspaceReady }: OnboardingScreenProps) {
  const [mode, setMode] = useState<'connect' | 'create' | 'join'>('connect');

  // Connect (Sign In) flow states
  const [connectStep, setConnectStep] = useState<'email' | 'verify' | 'select'>('email');
  const [connectEmail, setConnectEmail] = useState('');
  const [connectOtp, setConnectOtp] = useState('');
  const [isSendingConnectOtp, setIsSendingConnectOtp] = useState(false);
  const [isVerifyingConnect, setIsVerifyingConnect] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [isMockConnectOtp, setIsMockConnectOtp] = useState(false);
  const [foundWorkspaces, setFoundWorkspaces] = useState<Workspace[]>([]);
  const [isSearchingWorkspaces, setIsSearchingWorkspaces] = useState(false);

  // Create flow states
  const [createStep, setCreateStep] = useState<'details' | 'verify'>('details');
  const [workspaceName, setWorkspaceName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isMockOtp, setIsMockOtp] = useState(false);

  // Join flow states
  const [joinInput, setJoinInput] = useState('');
  const [joinPasskey, setJoinPasskey] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // ---------------------------------------------------------------------------
  // Connect / Sign In Handlers
  // ---------------------------------------------------------------------------
  const handleSendConnectOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError('');

    if (!connectEmail.trim() || !connectEmail.includes('@')) {
      setConnectError('Please enter a valid owner email address.');
      return;
    }

    setIsSendingConnectOtp(true);
    try {
      const res = await workspaceService.sendEmailOtp(connectEmail);
      if (res.success) {
        setIsMockConnectOtp(!!res.isMock);
        setConnectStep('verify');
      } else {
        setConnectError(res.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setConnectError(err.message || 'Error communicating with authentication service.');
    } finally {
      setIsSendingConnectOtp(false);
    }
  };

  const handleVerifyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError('');

    if (!connectOtp.trim()) {
      setConnectError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingConnect(true);
    try {
      const verifyRes = await workspaceService.verifyEmailOtp(connectEmail, connectOtp);
      if (verifyRes.success) {
        setIsSearchingWorkspaces(true);
        const workspaces = await workspaceService.findWorkspacesByOwner(connectEmail);
        setIsSearchingWorkspaces(false);

        if (workspaces.length > 0) {
          setFoundWorkspaces(workspaces);
          setConnectStep('select');
        } else {
          // If no workspaces exist for this email, transition to create flow seamlessly
          setWorkspaceName('');
          setOwnerEmail(connectEmail);
          setMode('create');
          setCreateStep('details');
          setCreateError('No existing workspace found for this email. Enter a business name to create your workspace.');
        }
      } else {
        setConnectError(verifyRes.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setConnectError(err.message || 'Verification failed.');
    } finally {
      setIsVerifyingConnect(false);
      setIsSearchingWorkspaces(false);
    }
  };

  const handleSelectWorkspace = async (ws: Workspace) => {
    await workspaceService.connectWorkspace(ws);
    onWorkspaceReady(ws);
  };

  // ---------------------------------------------------------------------------
  // Create Handlers
  // ---------------------------------------------------------------------------
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!workspaceName.trim()) {
      setCreateError('Please enter a business or workspace name.');
      return;
    }

    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setCreateError('Please enter a valid owner email address.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await workspaceService.sendEmailOtp(ownerEmail);
      if (res.success) {
        setIsMockOtp(!!res.isMock);
        setCreateStep('verify');
      } else {
        setCreateError(res.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error communicating with authentication service.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!otpCode.trim()) {
      setCreateError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      const verifyRes = await workspaceService.verifyEmailOtp(ownerEmail, otpCode);
      if (verifyRes.success) {
        const ws = await workspaceService.createWorkspace(workspaceName, ownerEmail, verifyRes.userId);
        onWorkspaceReady(ws);
      } else {
        setCreateError(verifyRes.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Join Handlers
  // ---------------------------------------------------------------------------
  const handleJoinInputChange = (val: string) => {
    setJoinInput(val);
    if (val.includes('#sync=')) {
      try {
        const hashPart = val.split('#sync=')[1];
        const [id, key] = decodeURIComponent(hashPart).split(':');
        if (id) setJoinInput(id);
        if (key) setJoinPasskey(key);
      } catch (_) {}
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    if (!joinInput.trim()) {
      setJoinError('Please enter a Workspace ID or paste a Pairing Link.');
      return;
    }

    setIsJoining(true);
    try {
      const ws = await workspaceService.joinWorkspace(joinInput, joinPasskey);
      onWorkspaceReady(ws);
    } catch (err: any) {
      setJoinError(err.message || 'Failed to connect to workspace.');
    } finally {
      setIsJoining(false);
    }
  };

  const isCloudActive = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-zinc-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-indigo-950 flex items-center justify-center shadow-lg ring-1 ring-white/10 mb-4">
            <Hexagon className="w-8 h-8 text-white fill-white/20" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Curate CRM</h1>
          <div className="flex items-center space-x-1.5 mt-1.5">
            {isCloudActive ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                <Cloud className="w-3 h-3 mr-1 text-emerald-400" />
                Cloud Synced
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                <Sparkles className="w-3 h-3 mr-1 text-zinc-400" />
                Local Device Mode
              </span>
            )}
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-800/80 p-1 rounded-xl mb-6 border border-zinc-700/40 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => { setMode('connect'); setConnectStep('email'); setConnectError(''); }}
            className={`flex items-center justify-center py-2 rounded-lg transition-all ${
              mode === 'connect'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 mr-1" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setCreateStep('details'); setCreateError(''); }}
            className={`flex items-center justify-center py-2 rounded-lg transition-all ${
              mode === 'create'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>New Business</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('join'); setJoinError(''); }}
            className={`flex items-center justify-center py-2 rounded-lg transition-all ${
              mode === 'join'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 mr-1" />
            <span>Pair Code</span>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MODE: Connect Existing Business */}
        {/* ------------------------------------------------------------------ */}
        {mode === 'connect' && (
          <div>
            {connectStep === 'email' && (
              <form onSubmit={handleSendConnectOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Business Owner Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="owner@yourcompany.com"
                      value={connectEmail}
                      onChange={(e) => setConnectEmail(e.target.value)}
                      className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    We will send a 6-digit code to verify your identity and restore your business workspaces and contacts.
                  </p>
                </div>

                {connectError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{connectError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingConnectOtp}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  {isSendingConnectOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Sign-In Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {connectStep === 'verify' && (
              <form onSubmit={handleVerifyConnect} className="space-y-4">
                <div className="text-center pb-1">
                  <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2 ring-1 ring-blue-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Enter Verification Code</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Sent to <span className="text-blue-300 font-medium">{connectEmail}</span>
                  </p>
                </div>

                {isMockConnectOtp && (
                  <div className="p-2.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Local Test Mode: Enter code <strong>123456</strong></span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={connectOtp}
                    onChange={(e) => setConnectOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl py-3 text-center text-xl tracking-[0.4em] font-mono text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                {connectError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{connectError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingConnect || isSearchingWorkspaces || connectOtp.length < 6}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isVerifyingConnect || isSearchingWorkspaces ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isSearchingWorkspaces ? 'Finding Your Businesses...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Find Business</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setConnectStep('email'); setConnectError(''); }}
                    className="text-xs text-zinc-400 hover:text-white underline transition-colors"
                  >
                    Change email address
                  </button>
                </div>
              </form>
            )}

            {connectStep === 'select' && (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 ring-1 ring-emerald-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Your Business Workspaces</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select a business to restore your contact directory:
                  </p>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {foundWorkspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectWorkspace(ws)}
                      className="w-full p-3.5 bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-blue-500/50 rounded-xl text-left flex items-center justify-between group transition-all"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors truncate">
                          {ws.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                          ID: {ws.id}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="border-t border-zinc-800 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceName('');
                      setOwnerEmail(connectEmail);
                      setMode('create');
                      setCreateStep('details');
                    }}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Another Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: Create Workspace */}
        {/* ------------------------------------------------------------------ */}
        {mode === 'create' && (
          <div>
            {createStep === 'details' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Business / Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Advisory, Northside Realty"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Owner Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="owner@yourcompany.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    We will send a 6-digit verification code to confirm ownership before creating your workspace.
                  </p>
                </div>

                {createError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{createError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndCreate} className="space-y-4">
                <div className="text-center pb-1">
                  <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2 ring-1 ring-blue-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Enter Verification Code</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Sent to <span className="text-blue-300 font-medium">{ownerEmail}</span>
                  </p>
                </div>

                {isMockOtp && (
                  <div className="p-2.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Local Test Mode: Enter code <strong>123456</strong></span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl py-3 text-center text-xl tracking-[0.4em] font-mono text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                {createError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{createError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || otpCode.length < 6}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Create Workspace</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setCreateStep('details'); setCreateError(''); }}
                    className="text-xs text-zinc-400 hover:text-white underline transition-colors"
                  >
                    Change email or workspace name
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: Join Workspace */}
        {/* ------------------------------------------------------------------ */}
        {mode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Workspace ID or One-Click Pairing Link
              </label>
              <input
                type="text"
                required
                placeholder="ws_abc123 or paste pairing link..."
                value={joinInput}
                onChange={(e) => handleJoinInputChange(e.target.value)}
                className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                autoFocus
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Tip: Paste the full pairing link from your office computer to auto-fill.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Workspace Passkey
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. k9d2-7842-xxxx"
                  value={joinPasskey}
                  onChange={(e) => setJoinPasskey(e.target.value)}
                  className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                />
              </div>
            </div>

            {joinError && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{joinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-blue-600/20"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect & Sync Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer Notice */}
      <div className="text-center mt-6 text-xs text-zinc-500 flex items-center space-x-2">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
        <span>Your data persists privately on this device in IndexedDB with cloud backup.</span>
      </div>
    </div>
  );
}
