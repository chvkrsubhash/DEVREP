import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Github,
  RefreshCw,
  EyeOff,
  Database,
  KeyRound,
  Award,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { ReputationScoreResult, HistoricalSnapshot, UserSession } from '@devrep/shared';
import { ScoreRadarChart } from './ScoreRadarChart';
import { ScoreTrajectoryChart } from './ScoreTrajectoryChart';
import { ScoreBreakdown } from './ScoreBreakdown';
import { AntiGamingAuditCard } from './AntiGamingAuditCard';
import { generateProfilePDF } from '../utils/pdfGenerator';

interface PrivateDashboardProps {
  userSession: UserSession | null;
  scoreData: ReputationScoreResult | null;
  snapshots: HistoricalSnapshot[];
  isLoading: boolean;
  onLoginClick: () => void;
  onRefresh: () => void;
}

export const PrivateDashboard: React.FC<PrivateDashboardProps> = ({
  userSession,
  scoreData,
  snapshots,
  isLoading,
  onLoginClick,
  onRefresh,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = () => {
    if (!scoreData) return;
    setIsDownloading(true);
    try {
      generateProfilePDF(scoreData);
    } catch (err) {
      console.error('Private PDF generation error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // If user is not logged in, render the Opt-In / Connect screen
  if (!userSession) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Private Repository Analytics (Opt-In)</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Unlock Your Complete <br />
            <span className="gradient-text-indigo">Private-Inclusive Reputation</span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Much of a senior engineer's best work happens inside private repositories, closed-source enterprise projects, and internal reviews.
            Connect your GitHub account with <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded font-mono text-xs border border-slate-200">repo</code> scope to produce a richer score visible <strong>ONLY</strong> to you.
          </p>

          {/* Privacy Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto mb-10 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <EyeOff className="w-5 h-5 text-sky-600 mb-2" />
              <h4 className="font-bold text-slate-900 mb-1">Zero Public Exposure</h4>
              <p className="text-slate-500 font-medium leading-relaxed">Private repository metrics will never appear on your public shareable link.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <Database className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="font-bold text-slate-900 mb-1">No Raw Code Saved</h4>
              <p className="text-slate-500 font-medium leading-relaxed">Only derived numeric metrics (commit counts, PRs, review velocity) are computed.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <KeyRound className="w-5 h-5 text-indigo-600 mb-2" />
              <h4 className="font-bold text-slate-900 mb-1">Encrypted Tokens</h4>
              <p className="text-slate-500 font-medium leading-relaxed">OAuth tokens are secured using AES-256-GCM encryption in PostgreSQL.</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={onLoginClick}
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all"
            >
              <Github className="w-5 h-5" />
              <span>Connect GitHub (Authorize repo scope)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If loading private score
  if (isLoading || !scoreData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Analyzing Private-Inclusive GitHub Activity...</h3>
        <p className="text-xs text-slate-500 font-medium">
          Calculating batched GraphQL signals across public and authorized private repositories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* 1. PRIVATE DASHBOARD HERO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-200 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-100/60 via-indigo-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          {/* Identity & Scope */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={scoreData.avatarUrl}
                alt={scoreData.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-2 ring-sky-400/50 object-cover shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-white border border-sky-300 text-sky-600 shadow-sm">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {scoreData.name || scoreData.username}
                </h2>
                <span className="text-sm font-mono text-sky-700 font-bold">@{scoreData.username}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Private Dashboard</span>
                </span>
              </div>

              {scoreData.bio && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mb-3 leading-relaxed font-medium">
                  {scoreData.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {scoreData.meta.publicRepoCount} Public Repos
                </span>
                {typeof scoreData.meta.privateRepoCountAnalyzed === 'number' && (
                  <span className="flex items-center gap-1.5 font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                    <Lock className="w-3 h-3 text-sky-600" />
                    +{scoreData.meta.privateRepoCountAnalyzed} Private Repos Indexed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Overall Score */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4 w-full lg:w-auto justify-between border-t lg:border-t-0 border-slate-200 pt-4 lg:pt-0">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-slate-900 shadow-md">
                <div className="text-center">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {scoreData.overallScore}
                  </span>
                  <span className="text-[10px] text-sky-400 block font-semibold uppercase tracking-wider">
                    / 100
                  </span>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border mb-1.5 uppercase tracking-wide bg-sky-100 text-sky-800 border-sky-300">
                  <Award className="w-3.5 h-3.5" />
                  {scoreData.tier}
                </span>
                <p className="text-xs text-slate-600 max-w-[220px] leading-snug font-medium">
                  {scoreData.tierDescription}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-sm transition-all"
                title="Directly download full private report as a PDF file"
              >
                <FileDown className="w-4 h-4 text-sky-400" />
                <span>{isDownloading ? 'Generating PDF...' : 'Download as PDF'}</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all border border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Isolation Guarantee Banner */}
        <div className="mt-6 pt-4 border-t border-sky-100 flex flex-wrap items-center justify-between text-xs text-sky-900 gap-2 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Strict Isolation Active: This private-inclusive view is ONLY accessible via authenticated session.</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Computed: {new Date(scoreData.meta.computedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. RADAR ANALYSIS & TRAJECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-600" />
                <span>Private-Inclusive 5-Dimensional Matrix</span>
              </h3>
              <span className="text-[11px] text-sky-700 uppercase tracking-wider font-bold">
                Complete Scope
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Includes private repositories, internal code reviews, and enterprise contributions.
            </p>
          </div>

          <ScoreRadarChart subScores={scoreData.subScores} dataMode="private-inclusive" />
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Private Score Trajectory</span>
              </h3>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Self-Only History
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Historical progression tracking overall private-inclusive score.
            </p>
          </div>

          <ScoreTrajectoryChart snapshots={snapshots} />
        </div>
      </div>

      {/* 3. ANTI-GAMING AUDIT */}
      <AntiGamingAuditCard audit={scoreData.antiGaming} />

      {/* 4. DETAILED BREAKDOWN */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Granular Metrics & Signals</h3>
          <span className="text-xs text-sky-700 font-mono font-bold">Private-Inclusive Mode</span>
        </div>
        <ScoreBreakdown
          subScores={scoreData.subScores}
          breakdown={scoreData.breakdown}
          username={scoreData.username}
        />
      </div>
    </div>
  );
};
