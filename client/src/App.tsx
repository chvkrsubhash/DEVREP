import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchHero } from './components/SearchHero';
import { PublicProfileView } from './components/PublicProfileView';
import { PrivateDashboard } from './components/PrivateDashboard';
import { CompareView } from './components/CompareView';
import { TrustGuaranteeModal } from './components/TrustGuaranteeModal';
import { ReputationScoreResult, HistoricalSnapshot, UserSession } from './types/shared';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'compare'>('public');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false);

  // Public single profile state
  const [currentPublicUser, setCurrentPublicUser] = useState<string>('');
  const [publicScore, setPublicScore] = useState<ReputationScoreResult | null>(null);
  const [publicSnapshots, setPublicSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [isPublicLoading, setIsPublicLoading] = useState<boolean>(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  // Private state
  const [privateScore, setPrivateScore] = useState<ReputationScoreResult | null>(null);
  const [privateSnapshots, setPrivateSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [isPrivateLoading, setIsPrivateLoading] = useState<boolean>(false);
  const [privateError, setPrivateError] = useState<string | null>(null);

  // Compare state
  const [compareUserA, setCompareUserA] = useState<ReputationScoreResult | null>(null);
  const [compareUserB, setCompareUserB] = useState<ReputationScoreResult | null>(null);
  const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // 1. Initial Session Check & Route Parsing
  useEffect(() => {
    checkSession();

    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    if (path.startsWith('/u/')) {
      const username = path.replace('/u/', '').trim();
      if (username) {
        setCurrentPublicUser(username);
        fetchPublicScore(username);
        return;
      }
    } else if (path === '/dashboard') {
      setActiveTab('private');
    } else if (path === '/compare' || searchParams.has('u1')) {
      setActiveTab('compare');
      const u1 = searchParams.get('u1') || 'torvalds';
      const u2 = searchParams.get('u2') || 'gaearon';
      handleCompareSearch(u1, u2);
    }
  }, []);

  // 2. When activeTab changes to private, fetch private score if logged in
  useEffect(() => {
    if (activeTab === 'private' && userSession && !privateScore) {
      fetchPrivateScore();
    }
  }, [activeTab, userSession]);

  const checkSession = async () => {
    try {
      const res = await fetch('/auth/me');
      const data = await res.json();
      if (data.isAuthenticated && data.user) {
        setUserSession(data.user);
      }
    } catch (err) {
      console.warn('Session check failed:', err);
    }
  };

  const fetchPublicScore = async (username: string, refresh = false) => {
    setIsPublicLoading(true);
    setPublicError(null);
    try {
      const [scoreRes, historyRes] = await Promise.all([
        fetch(`/api/public/${encodeURIComponent(username)}${refresh ? '?refresh=true' : ''}`),
        fetch(`/api/public/${encodeURIComponent(username)}/history`),
      ]);

      if (!scoreRes.ok) {
        const errData = await scoreRes.json();
        throw new Error(errData.message || 'Failed to fetch public developer score');
      }

      const scoreData: ReputationScoreResult = await scoreRes.json();
      const historyData: HistoricalSnapshot[] = historyRes.ok ? await historyRes.json() : [];

      setPublicScore(scoreData);
      setPublicSnapshots(historyData);
      setCurrentPublicUser(username);
      window.history.pushState(null, '', `/u/${username}`);
    } catch (err: any) {
      setPublicError(err.message || 'Unable to analyze requested user on GitHub.');
    } finally {
      setIsPublicLoading(false);
    }
  };

  const fetchPrivateScore = async (refresh = false) => {
    setIsPrivateLoading(true);
    setPrivateError(null);
    try {
      const [scoreRes, historyRes] = await Promise.all([
        fetch(`/api/me/score${refresh ? '?refresh=true' : ''}`),
        fetch('/api/me/history'),
      ]);

      if (!scoreRes.ok) {
        const errData = await scoreRes.json();
        throw new Error(errData.message || 'Failed to fetch private developer score');
      }

      const scoreData: ReputationScoreResult = await scoreRes.json();
      const historyData: HistoricalSnapshot[] = historyRes.ok ? await historyRes.json() : [];

      setPrivateScore(scoreData);
      setPrivateSnapshots(historyData);
    } catch (err: any) {
      setPrivateError(err.message || 'Failed to load private score');
    } finally {
      setIsPrivateLoading(false);
    }
  };

  const handleCompareSearch = async (u1: string, u2: string) => {
    setIsCompareLoading(true);
    setCompareError(null);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/public/${encodeURIComponent(u1)}`),
        fetch(`/api/public/${encodeURIComponent(u2)}`),
      ]);

      if (!resA.ok) {
        const errA = await resA.json();
        throw new Error(`Developer 1 (@${u1}): ${errA.message || 'Failed to fetch'}`);
      }
      if (!resB.ok) {
        const errB = await resB.json();
        throw new Error(`Developer 2 (@${u2}): ${errB.message || 'Failed to fetch'}`);
      }

      const dataA: ReputationScoreResult = await resA.json();
      const dataB: ReputationScoreResult = await resB.json();

      setCompareUserA(dataA);
      setCompareUserB(dataB);
      window.history.pushState(null, '', `/compare?u1=${u1}&u2=${u2}`);
    } catch (err: any) {
      setCompareError(err.message || 'Failed to benchmark developers.');
    } finally {
      setIsCompareLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = '/auth/github';
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      setUserSession(null);
      setPrivateScore(null);
      setActiveTab('public');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Header
        userSession={userSession}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenTrustModal={() => setIsTrustModalOpen(true)}
        onLoginClick={handleOAuthLogin}
        onLogoutClick={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'public' && (
          <div>
            {/* Search Hero */}
            <SearchHero onSearch={(u) => fetchPublicScore(u)} isLoading={isPublicLoading} />

            {/* Error Message if any */}
            {publicError && (
              <div className="max-w-3xl mx-auto px-4 mb-6">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 font-medium shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>{publicError}</span>
                </div>
              </div>
            )}

            {/* Profile View */}
            {publicScore && (
              <PublicProfileView
                scoreData={publicScore}
                snapshots={publicSnapshots}
                onRefresh={() => fetchPublicScore(currentPublicUser, true)}
                isLoading={isPublicLoading}
              />
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <CompareView
            onCompareSearch={handleCompareSearch}
            userA={compareUserA}
            userB={compareUserB}
            isLoading={isCompareLoading}
            error={compareError}
          />
        )}

        {activeTab === 'private' && (
          <div className="pt-8">
            {privateError && (
              <div className="max-w-3xl mx-auto px-4 mb-6">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 font-medium shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>{privateError}</span>
                </div>
              </div>
            )}

            <PrivateDashboard
              userSession={userSession}
              scoreData={privateScore}
              snapshots={privateSnapshots}
              isLoading={isPrivateLoading}
              onLoginClick={handleOAuthLogin}
              onRefresh={() => fetchPrivateScore(true)}
            />
          </div>
        )}
      </main>

      {/* Trust & Privacy Modal */}
      <TrustGuaranteeModal isOpen={isTrustModalOpen} onClose={() => setIsTrustModalOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">DevRep Engine</span>
            <span>—</span>
            <span>Auditable Developer Scoring System</span>
          </div>
          <p className="text-slate-500">
            Strict separation of public profiles & private-inclusive self-only scopes.
          </p>
        </div>
      </footer>
    </div>
  );
};
