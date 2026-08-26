import React from 'react';
import {
  Star,
  GitFork,
  GitPullRequest,
  CheckCircle2,
  Calendar,
  Layers,
  Code2,
  GitMerge,
  Flame,
} from 'lucide-react';
import { SubScores, MetricBreakdown } from '@devrep/shared';

interface ScoreBreakdownProps {
  subScores: SubScores;
  breakdown: MetricBreakdown;
  username?: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ subScores, breakdown }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 1. CODE IMPACT */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-400/50 hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Star className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Code Impact</h3>
            </div>
            <span className="font-mono font-extrabold text-base text-amber-600">
              {subScores.impact}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
            Original (non-fork) repo stars & forks with exponential recency decay.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Original Stars</span>
              <span className="text-base font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {breakdown.impact.originalStars.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Original Forks</span>
              <span className="text-base font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-indigo-500" />
                {breakdown.impact.originalForks.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Top Repos */}
          {breakdown.impact.topStarredRepos.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Top Repositories</span>
              {breakdown.impact.topStarredRepos.slice(0, 3).map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="font-mono text-slate-700 font-medium truncate max-w-[160px]">{r.name}</span>
                  <span className="text-amber-600 font-mono font-semibold flex items-center gap-1">
                    ★ {r.stars}
                    {r.isPrivate && (
                      <span className="text-[10px] text-sky-700 bg-sky-50 px-1 py-0.5 rounded border border-sky-200">
                        Private
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. COLLABORATION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-400/50 hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <GitMerge className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Collaboration</h3>
            </div>
            <span className="font-mono font-extrabold text-base text-indigo-600">
              {subScores.collaboration}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
            Merged PR ratio, code reviews given to peers, and issue resolution engagement.
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">PR Acceptance Rate</span>
                <span className="font-mono font-bold text-slate-800">
                  {Math.round(breakdown.collaboration.mergedRatio * 100)}% ({breakdown.collaboration.mergedPRsCount}/{breakdown.collaboration.totalPRsCreated})
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, breakdown.collaboration.mergedRatio * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">Code Reviews</span>
                <span className="text-base font-bold text-slate-900 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {breakdown.collaboration.codeReviewsGiven}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">Issues Involved</span>
                <span className="text-base font-bold text-slate-900 font-mono flex items-center gap-1.5">
                  <GitPullRequest className="w-3.5 h-3.5 text-sky-600" />
                  {breakdown.collaboration.issuesInvolved}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONSISTENCY */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-400/50 hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Consistency</h3>
            </div>
            <span className="font-mono font-extrabold text-base text-emerald-600">
              {subScores.consistency}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
            Cadence entropy over 52 weeks (steady sustainable rhythm over burst script spam).
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-700 font-medium">Active Weeks (Past Year)</span>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-700">
                {breakdown.consistency.activeWeeksInLastYear} / 52
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">Longest Streak</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {breakdown.consistency.longestStreakWeeks} wks
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">Cadence Entropy</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {(breakdown.consistency.weeklyCadenceEntropy * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BREADTH */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-sky-400/50 hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Breadth</h3>
            </div>
            <span className="font-mono font-extrabold text-base text-sky-600">
              {subScores.breadth}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">
            Language ecosystem diversity and external repository contributions.
          </p>

          <div className="space-y-2 mb-4">
            {breakdown.breadth.primaryLanguages.slice(0, 4).map((lang, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-mono text-[11px] font-semibold">{lang.language}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{lang.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">External Contribs</span>
            <span className="font-bold font-mono text-sky-700">
              {breakdown.breadth.externalContributionsCount} PRs
            </span>
          </div>
        </div>
      </div>

      {/* 5. QUALITY SIGNALS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-purple-400/50 hover:shadow-md transition-all md:col-span-2 lg:col-span-2">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Quality & Hygiene Signals</h3>
            </div>
            <span className="font-mono font-extrabold text-base text-purple-600">
              {subScores.quality}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
            PR sizing sweet spot (rewards digestible reviewed diffs &gt; giant unreviewed dumps) and low rollback rate.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Avg PR Size</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                +{breakdown.quality.averagePRAdditions} / -{breakdown.quality.averagePRDeletions}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">
                {breakdown.quality.prSizeScore >= 80 ? '✓ Optimal Digestible Size' : 'Moderate Size'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Revert & Rollback PRs</span>
              <span className="text-sm font-bold text-slate-900 font-mono flex items-center gap-1">
                {breakdown.quality.revertPRCount === 0 ? (
                  <span className="text-emerald-700 font-semibold">0 Reverts (Clean)</span>
                ) : (
                  <span className="text-amber-700 font-semibold">{breakdown.quality.revertPRCount} Reverts</span>
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Hygiene Rating</span>
              <span className="text-sm font-bold text-purple-700 font-mono">
                {breakdown.quality.prSizeScore}/100 Pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
