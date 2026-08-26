import React, { useState } from 'react';
import {
  Share2,
  RefreshCw,
  Globe,
  ExternalLink,
  MapPin,
  Building,
  Award,
  Check,
  TrendingUp,
  Code2,
  FileDown,
} from 'lucide-react';
import { ReputationScoreResult, HistoricalSnapshot } from '@devrep/shared';
import { ScoreRadarChart } from './ScoreRadarChart';
import { ScoreTrajectoryChart } from './ScoreTrajectoryChart';
import { ScoreBreakdown } from './ScoreBreakdown';
import { AntiGamingAuditCard } from './AntiGamingAuditCard';
import { generateProfilePDF } from '../utils/pdfGenerator';

interface PublicProfileViewProps {
  scoreData: ReputationScoreResult;
  snapshots: HistoricalSnapshot[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  scoreData,
  snapshots,
  onRefresh,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/u/${scoreData.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      generateProfilePDF(scoreData);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'Open-Source Luminary':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'System Architect':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Core Crafter':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Active Contributor':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* 1. PROFILE HEADER & OVERALL SCORE HERO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-100/60 via-sky-50/40 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          {/* Left: User Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={scoreData.avatarUrl}
                alt={scoreData.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-2 ring-indigo-500/20 object-cover shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {scoreData.name || scoreData.username}
                </h2>
                <span className="text-sm font-mono text-slate-500 font-semibold">@{scoreData.username}</span>
                <a
                  href={`https://github.com/${scoreData.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {scoreData.bio && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mb-3 leading-relaxed font-medium">
                  {scoreData.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {scoreData.company && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {scoreData.company}
                  </span>
                )}
                {scoreData.location && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {scoreData.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  <Code2 className="w-3.5 h-3.5" />
                  {scoreData.meta.publicRepoCount} Public Repos
                </span>
              </div>
            </div>
          </div>

          {/* Right: Overall Score Badge & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4 w-full lg:w-auto justify-between border-t lg:border-t-0 border-slate-200 pt-4 lg:pt-0">
            <div className="flex items-center gap-4">
              {/* Circular Score Badge */}
              <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-slate-900 shadow-md">
                <div className="text-center">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {scoreData.overallScore}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    / 100
                  </span>
                </div>
              </div>

              {/* Tier Details */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border mb-1.5 uppercase tracking-wide shadow-sm ${getTierBadgeStyle(
                    scoreData.tier
                  )}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {scoreData.tier}
                </span>
                <p className="text-xs text-slate-600 max-w-[220px] leading-snug font-medium">
                  {scoreData.tierDescription}
                </p>
              </div>
            </div>

            {/* Actions: Download PDF, Share & Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-sm transition-all"
                title="Directly download full developer reputation report as a PDF file"
              >
                <FileDown className="w-4 h-4 text-indigo-400" />
                <span>{isDownloading ? 'Generating PDF...' : 'Download as PDF'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all disabled:opacity-50"
                title="Recalculate Score"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Public Scope Guarantee Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">Public Mode: Computed exclusively from public GitHub activity.</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Computed: {new Date(scoreData.meta.computedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. RADAR ANALYSIS & HISTORICAL TRAJECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5-Axis Radar Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>5-Dimensional Reputation Matrix</span>
              </h3>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Balanced Scale
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Interactive 5-axis profile showing impact, collaboration, cadence, breadth, and code hygiene.
            </p>
          </div>

          <ScoreRadarChart subScores={scoreData.subScores} dataMode="public" />
        </div>

        {/* Historical Score Trajectory */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                <span>Score Trajectory History</span>
              </h3>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                Snapshots
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Historical trend over time as new contributions, PRs, and stars are indexed.
            </p>
          </div>

          <ScoreTrajectoryChart snapshots={snapshots} />
        </div>
      </div>

      {/* 3. ANTI-GAMING AUDIT */}
      <AntiGamingAuditCard audit={scoreData.antiGaming} />

      {/* 4. DETAILED METRIC BREAKDOWN */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Granular Metrics & Signals</h3>
          <span className="text-xs text-slate-500 font-mono">Weighted Algorithm v1.0</span>
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
