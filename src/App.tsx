/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutDashboard, Hexagon } from 'lucide-react';
import LeadCaptureForm from './components/LeadCaptureForm';
import LeadDashboard from './components/LeadDashboard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { workspaceService } from './services/workspaceService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'capture' | 'dashboard'>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check if the user navigated here via a cross-device pairing link
    workspaceService.checkAndApplyPairingHash().then(ws => {
      if (ws) {
        setRefreshKey(k => k + 1);
      }
    });
  }, []);

  const handleWorkspaceChanged = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-blue-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-800 to-indigo-900 text-white shadow-sm ring-1 ring-black/5">
                <Hexagon className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20" strokeWidth={2.5} />
              </div>
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold tracking-tight text-zinc-900 font-sans whitespace-nowrap truncate hidden min-[360px]:block">
                Curate
              </h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 pl-2">
              <PWAInstallButton />
              <button
                onClick={() => setActiveTab('capture')}
                className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'capture' 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <PlusCircle className="w-4 h-4 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Add Contact</span>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Workspace Switcher & Sync Status */}
        <WorkspaceHeader onWorkspaceChanged={handleWorkspaceChanged} />

        {activeTab === 'capture' ? (
          <div className="max-w-3xl mx-auto">
            <LeadCaptureForm onSuccess={() => setActiveTab('dashboard')} />
          </div>
        ) : (
          <LeadDashboard key={refreshKey} />
        )}
      </main>
    </div>
  );
}
