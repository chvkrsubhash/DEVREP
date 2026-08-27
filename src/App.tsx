import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchHero } from './components/SearchHero';
import { PublicProfileView } from './components/PublicProfileView';
import { PrivateDashboard } from './components/PrivateDashboard';
import { CompareView } from './components/CompareView';
import { TrustGuaranteeModal } from './components/TrustGuaranteeModal';
import { ReputationScoreResult, HistoricalSnapshot, UserSession } from './types/shared';
import { fetchGitHubDeveloperData } from './utils/github';
import { computeDeveloperReputation } from './utils/scoring';

export const App: React.FC = () => {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'compare'>('public');
  const [isTrustModalOpen, setIsTrustModalOpen] = useState<boolean>(false);

  // User Session (stored locally in browser)
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('devrep_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Public Profile State
  const [currentPublicUser, setCurrentPublicUser] = useState<string>('torvalds');
  const [publicScore, setPublicScore] = useState<ReputationScoreResult | null>(null);
  const [publicSnapshots, setPublicSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [isPublicLoading, setIsPublicLoading] = useState<boolean>(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  // Private Dashboard State
  const [privateScore, setPrivateScore] = useState<ReputationScoreResult | null>(null);
  const [privateSnapshots, setPrivateSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [isPrivateLoading, setIsPrivateLoading] = useState<boolean>(false);
  const [privateError, setPrivateError] = useState<string | null>(null);

  // Compare Mode State
  const [compareUserA, setCompareUserA] = useState<ReputationScoreResult | null>(null);
  const [compareUserB, setCompareUserB] = useState<ReputationScoreResult | null>(null);
  const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Helper to load/save snapshots from localStorage
  const getLocalSnapshots = (username: string, mode: string): HistoricalSnapshot[] => {
    try {
      const key = `devrep_snapshots_${mode}_${username.toLowerCase()}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveLocalSnapshot = (username: string, mode: string, result: ReputationScoreResult) => {
    try {
      const key = `devrep_snapshots_${mode}_${username.toLowerCase()}`;
      const existing = getLocalSnapshots(username, mode);
      const newSnapshot: HistoricalSnapshot = {
        id: Math.random().toString(36).substring(7),
        overallScore: result.overallScore,
        subScores: result.subScores,
        dataMode: mode as any,
        computedAt: new Date().toISOString(),
      };
      const updated = [...existing.slice(-14), newSnapshot];
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  };

  // 1. Initial Route Parsing & OAuth Token Capture
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    // Check if returning from official GitHub OAuth authorization
    const oauthToken = searchParams.get('token');
    const oauthUsername = searchParams.get('username');
    const oauthAvatar = searchParams.get('avatar');
    const oauthId = searchParams.get('id');

    if (oauthToken && oauthUsername) {
      const session: UserSession = {
        id: oauthId || Math.random().toString(36).substring(7),
        githubId: oauthId || 'user_' + oauthUsername,
        username: oauthUsername,
        avatarUrl: oauthAvatar || `https://github.com/${oauthUsername}.png`,
        hasPrivateAccess: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('devrep_github_token', oauthToken.trim());
      localStorage.setItem('devrep_user_session', JSON.stringify(session));
      setUserSession(session);
      setActiveTab('private');
      window.history.replaceState(null, '', '/dashboard');

      // Compute private score immediately with authorized token
      fetchPrivateScore(oauthToken);
      return;
    }

    if (path.startsWith('/u/')) {
      const username = path.replace('/u/', '').trim();
      if (username) {
        setCurrentPublicUser(username);
        fetchPublicScore(username);
        return;
      }
    } else if (path === '/dashboard') {
      setActiveTab('private');
      if (userSession) {
        fetchPrivateScore();
      }
      return;
    } else if (path === '/compare' || searchParams.has('u1')) {
      setActiveTab('compare');
      const u1 = searchParams.get('u1') || 'torvalds';
      const u2 = searchParams.get('u2') || 'gaearon';
      handleCompareSearch(u1, u2);
      return;
    }

    // Default initial fetch
    fetchPublicScore('torvalds');
  }, []);

  // 2. Fetch Public Score
  const fetchPublicScore = async (username: string) => {
    setIsPublicLoading(true);
    setPublicError(null);
    try {
      const rawData = await fetchGitHubDeveloperData(username);
      const scoreData = computeDeveloperReputation(rawData, 'public');
      const snapshots = saveLocalSnapshot(username, 'public', scoreData);

      setPublicScore(scoreData);
      setPublicSnapshots(snapshots);
      setCurrentPublicUser(username);
      window.history.pushState(null, '', `/u/${username}`);
    } catch (err: any) {
      setPublicError(err.message || 'Unable to analyze requested user on GitHub.');
    } finally {
      setIsPublicLoading(false);
    }
  };

  // 3. Fetch Private Score
  const fetchPrivateScore = async (explicitToken?: string) => {
    const token = explicitToken || localStorage.getItem('devrep_github_token') || '';
    if (!token && !userSession) return;
    setIsPrivateLoading(true);
    setPrivateError(null);
    try {
      const rawData = await fetchGitHubDeveloperData('me', token);
      const scoreData = computeDeveloperReputation(rawData, 'private-inclusive');
      const snapshots = saveLocalSnapshot(rawData.user.login, 'private-inclusive', scoreData);

      setPrivateScore(scoreData);
      setPrivateSnapshots(snapshots);
    } catch (err: any) {
      setPrivateError(err.message || 'Failed to calculate private-inclusive score.');
    } finally {
      setIsPrivateLoading(false);
    }
  };

  // 4. Compare Search
  const handleCompareSearch = async (u1: string, u2: string) => {
    setIsCompareLoading(true);
    setCompareError(null);
    try {
      const [rawDataA, rawDataB] = await Promise.all([
        fetchGitHubDeveloperData(u1),
        fetchGitHubDeveloperData(u2),
      ]);

      const dataA = computeDeveloperReputation(rawDataA, 'public');
      const dataB = computeDeveloperReputation(rawDataB, 'public');

      setCompareUserA(dataA);
      setCompareUserB(dataB);
      window.history.pushState(null, '', `/compare?u1=${u1}&u2=${u2}`);
    } catch (err: any) {
      setCompareError(err.message || 'Failed to benchmark developers.');
    } finally {
      setIsCompareLoading(false);
    }
  };

  // 5. Direct Official 1-Click GitHub OAuth Authorization
  const handleOAuthLogin = () => {
    window.location.href = '/api/auth/github';
  };

  const handleLogout = () => {
    setUserSession(null);
    setPrivateScore(null);
    localStorage.removeItem('devrep_github_token');
    localStorage.removeItem('devrep_user_session');
    setActiveTab('public');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userSession={userSession}
        onLoginClick={handleOAuthLogin}
        onLogoutClick={handleLogout}
        onOpenTrustModal={() => setIsTrustModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'public' && (
          <div className="space-y-8">
            <SearchHero
              onSearch={(username) => fetchPublicScore(username)}
              isLoading={isPublicLoading}
              currentUsername={currentPublicUser}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {publicError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium mb-6 animate-in fade-in flex items-center justify-between">
                  <span>{publicError}</span>
                  <button
                    onClick={() => setPublicError(null)}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-4"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <PublicProfileView
                scoreData={publicScore}
                snapshots={publicSnapshots}
                isLoading={isPublicLoading}
                onRefresh={() => fetchPublicScore(currentPublicUser)}
              />
            </div>
          </div>
        )}

        {activeTab === 'private' && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {privateError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium mb-6">
                  {privateError}
                </div>
              )}

              <PrivateDashboard
                userSession={userSession}
                scoreData={privateScore}
                snapshots={privateSnapshots}
                isLoading={isPrivateLoading}
                onLoginClick={handleOAuthLogin}
                onRefresh={() => fetchPrivateScore()}
              />
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CompareView
                userA={compareUserA}
                userB={compareUserB}
                isLoading={isCompareLoading}
                error={compareError}
                onSearch={handleCompareSearch}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
          <p>© {new Date().getFullYear()} DevRep Analytics. Pure mathematical GitHub reputation audit engine.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsTrustModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Anti-Gaming Guarantee
            </button>
            <a
              href="https://github.com/chvkrsubhash/DEVREP"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              GitHub Source
            </a>
          </div>
        </div>
      </footer>

      {/* Trust & Guarantee Modal */}
      <TrustGuaranteeModal
        isOpen={isTrustModalOpen}
        onClose={() => setIsTrustModalOpen(false)}
      />
    </div>
  );
};
