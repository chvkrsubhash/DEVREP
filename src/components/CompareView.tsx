import React, { useState } from 'react';
import {
  GitCompare,
  ArrowRight,
  Star,
  GitMerge,
  Calendar,
  Layers,
  Code2,
  Share2,
  Check,
  Award,
  AlertCircle,
  TrendingUp,
  FileDown,
} from 'lucide-react';
import { ReputationScoreResult } from '../types/shared';
import { CompareRadarChart } from './CompareRadarChart';
import { generateComparisonPDF } from '../utils/pdfGenerator';

interface CompareViewProps {
  onCompareSearch: (u1: string, u2: string) => void;
  userA: ReputationScoreResult | null;
  userB: ReputationScoreResult | null;
  isLoading: boolean;
  error: string | null;
}

const PRESET_MATCHUPS = [
  { u1: 'torvalds', u2: 'gaearon', label: 'Linus Torvalds vs Dan Abramov' },
  { u1: 'yyx990803', u2: 'antfu', label: 'Evan You vs Anthony Fu' },
  { u1: 'sindresorhus', u2: 'tj', label: 'Sindre Sorhus vs TJ Holowaychuk' },
];

export const CompareView: React.FC<CompareViewProps> = ({
  onCompareSearch,
  userA,
  userB,
  isLoading,
  error,
}) => {
  const [inputU1, setInputU1] = useState(userA?.username || 'torvalds');
  const [inputU2, setInputU2] = useState(userB?.username || 'gaearon');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputU1.trim() && inputU2.trim()) {
      onCompareSearch(inputU1.trim(), inputU2.trim());
    }
  };

  const handleCopyShare = () => {
    if (!userA || !userB) return;
    const url = `${window.location.origin}/compare?u1=${userA.username}&u2=${userB.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!userA || !userB) return;
    setIsDownloading(true);
    try {
      generateComparisonPDF(userA, userB);
    } catch (err) {
      console.error('Comparison PDF error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8 animate-in fade-in duration-300">
      {/* Search Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 mb-4">
          <GitCompare className="w-4 h-4 text-indigo-600" />
          <span>Head-to-Head Developer Comparison</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Compare Developer <span className="gradient-text-indigo">Reputation & Metrics</span>
        </h2>
        <p className="text-sm text-slate-600 font-medium max-w-xl mx-auto mb-6 leading-relaxed">
          Benchmark two developers across 5 key dimensions: code impact, collaboration, cadence consistency, breadth, and quality signals.
        </p>

        {/* Dual Search Input */}
        <form onSubmit={handleSubmit} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md max-w-2xl mx-auto mb-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="First developer (e.g. torvalds)"
                value={inputU1}
                onChange={(e) => setInputU1(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-2.5 text-[11px] font-bold text-indigo-600">Dev A</span>
            </div>

            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">VS</span>

            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="Second developer (e.g. gaearon)"
                value={inputU2}
                onChange={(e) => setInputU2(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-600">Dev B</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputU1.trim() || !inputU2.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Compare</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preset Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Popular Matchups:</span>
          {PRESET_MATCHUPS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputU1(preset.u1);
                setInputU2(preset.u2);
                onCompareSearch(preset.u1, preset.u2);
              }}
              className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-mono shadow-sm transition-all text-[11px]"
            >
              @{preset.u1} vs @{preset.u2}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {userA && userB && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Actions */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Head-to-Head Comparison Summary</h3>
              <p className="text-xs text-slate-500">
                Comparing @{userA.username} (Indigo) vs @{userB.username} (Emerald)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-sm transition-all"
                title="Directly download comparison report as a PDF file"
              >
                <FileDown className="w-4 h-4 text-indigo-400" />
                <span>{isDownloading ? 'Generating...' : 'Download as PDF'}</span>
              </button>

              <button
                onClick={handleCopyShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-indigo-600" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Developer A Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={userA.avatarUrl}
                    alt={userA.username}
                    className="w-16 h-16 rounded-2xl ring-2 ring-indigo-500 object-cover shadow-md"
                  />
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900">{userA.name || userA.username}</h4>
                    <span className="text-xs font-mono font-bold text-indigo-600">@{userA.username}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black text-indigo-600 font-mono">{userA.overallScore}</span>
                  <span className="text-[10px] text-slate-400 block font-bold">/ 100 PTS</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 mb-3">
                <Award className="w-3.5 h-3.5" />
                <span>{userA.tier}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                {userA.bio || 'Public GitHub contributor.'}
              </p>
            </div>

            {/* Developer B Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={userB.avatarUrl}
                    alt={userB.username}
                    className="w-16 h-16 rounded-2xl ring-2 ring-emerald-500 object-cover shadow-md"
                  />
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900">{userB.name || userB.username}</h4>
                    <span className="text-xs font-mono font-bold text-emerald-600">@{userB.username}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-600 font-mono">{userB.overallScore}</span>
                  <span className="text-[10px] text-slate-400 block font-bold">/ 100 PTS</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
                <Award className="w-3.5 h-3.5" />
                <span>{userB.tier}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                {userB.bio || 'Public GitHub contributor.'}
              </p>
            </div>
          </div>

          {/* Dual Overlay Radar Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>5-Axis Matrix Overlay Comparison</span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Direct overlay of strengths and dimensions for both developers.
                </p>
              </div>
            </div>

            <CompareRadarChart userA={userA} userB={userB} />
          </div>

          {/* Detailed Metric Head-to-Head Comparison Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h4 className="text-base font-extrabold text-slate-900 mb-6">Detailed Metric Benchmarks</h4>

            <div className="space-y-4">
              {/* 1. Code Impact */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Code Impact</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="text-indigo-600">@{userA.username}: {userA.subScores.impact}/100</span>
                    <span className="text-slate-400">vs</span>
                    <span className="text-emerald-600">@{userB.username}: {userB.subScores.impact}/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Original Stars & Forks</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ★ {userA.breakdown.impact.originalStars.toLocaleString()} / ⑂ {userA.breakdown.impact.originalForks.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Original Stars & Forks</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ★ {userB.breakdown.impact.originalStars.toLocaleString()} / ⑂ {userB.breakdown.impact.originalForks.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Collaboration */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                    <GitMerge className="w-4 h-4 text-indigo-600" />
                    <span>Collaboration & PR Acceptance</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="text-indigo-600">@{userA.username}: {userA.subScores.collaboration}/100</span>
                    <span className="text-slate-400">vs</span>
                    <span className="text-emerald-600">@{userB.username}: {userB.subScores.collaboration}/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">PR Merge Ratio & Reviews</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {Math.round(userA.breakdown.collaboration.mergedRatio * 100)}% merged • {userA.breakdown.collaboration.codeReviewsGiven} reviews
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">PR Merge Ratio & Reviews</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {Math.round(userB.breakdown.collaboration.mergedRatio * 100)}% merged • {userB.breakdown.collaboration.codeReviewsGiven} reviews
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Consistency */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Cadence & Consistency</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="text-indigo-600">@{userA.username}: {userA.subScores.consistency}/100</span>
                    <span className="text-slate-400">vs</span>
                    <span className="text-emerald-600">@{userB.username}: {userB.subScores.consistency}/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Weeks & Streak</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {userA.breakdown.consistency.activeWeeksInLastYear}/52 wks • {userA.breakdown.consistency.longestStreakWeeks} wk streak
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Weeks & Streak</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {userB.breakdown.consistency.activeWeeksInLastYear}/52 wks • {userB.breakdown.consistency.longestStreakWeeks} wk streak
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Breadth */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>Breadth & External Contribs</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="text-indigo-600">@{userA.username}: {userA.subScores.breadth}/100</span>
                    <span className="text-slate-400">vs</span>
                    <span className="text-emerald-600">@{userB.username}: {userB.subScores.breadth}/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Languages</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {userA.breakdown.breadth.primaryLanguages.slice(0, 3).map(l => l.language).join(', ') || 'Various'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Languages</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {userB.breakdown.breadth.primaryLanguages.slice(0, 3).map(l => l.language).join(', ') || 'Various'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Quality */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                    <Code2 className="w-4 h-4 text-purple-600" />
                    <span>Quality Signals & PR Hygiene</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="text-indigo-600">@{userA.username}: {userA.subScores.quality}/100</span>
                    <span className="text-slate-400">vs</span>
                    <span className="text-emerald-600">@{userB.username}: {userB.subScores.quality}/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Avg PR Changes & Reverts</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +{userA.breakdown.quality.averagePRAdditions}/-{userA.breakdown.quality.averagePRDeletions} • {userA.breakdown.quality.revertPRCount} reverts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Avg PR Changes & Reverts</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +{userB.breakdown.quality.averagePRAdditions}/-{userB.breakdown.quality.averagePRDeletions} • {userB.breakdown.quality.revertPRCount} reverts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
