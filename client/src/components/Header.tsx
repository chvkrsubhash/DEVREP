import React from 'react';
import { ShieldCheck, Lock, Globe, Github, LogOut, GitCompare } from 'lucide-react';
import { UserSession } from '../types/shared';

interface HeaderProps {
  userSession: UserSession | null;
  activeTab: 'public' | 'private' | 'compare';
  onSelectTab: (tab: 'public' | 'private' | 'compare') => void;
  onOpenTrustModal: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userSession,
  activeTab,
  onSelectTab,
  onOpenTrustModal,
  onLoginClick,
  onLogoutClick,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('public')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">DevRep</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">GitHub Developer Reputation Engine</p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => onSelectTab('public')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'public'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public</span>
          </button>

          <button
            onClick={() => onSelectTab('compare')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'compare'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>

          <button
            onClick={() => onSelectTab('private')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'private'
                ? 'bg-white text-sky-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Private</span>
          </button>
        </div>

        {/* Right Actions: Trust Guarantee & Auth */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTrustModal}
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200/70 transition-colors font-medium"
            title="View Public/Private Privacy Guarantee"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Privacy Boundary</span>
          </button>

          {userSession ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                <img
                  src={userSession.avatarUrl || `https://github.com/${userSession.username}.png`}
                  alt={userSession.username}
                  className="w-6 h-6 rounded-full ring-1 ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800">@{userSession.username}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected with repo scope" />
              </div>
              <button
                onClick={onLogoutClick}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Github className="w-4 h-4" />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
