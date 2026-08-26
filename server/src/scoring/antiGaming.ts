import { RawDeveloperData } from './types';
import { AntiGamingAudit } from '../types/shared';

/**
 * Anti-gaming heuristics to protect score integrity against common GitHub farming tactics:
 * 1. Single-day massive commit bursts with zero PRs or reviews (cron commit scripts)
 * 2. Massive fork counts with 0 original commits or stars (fork bombing)
 * 3. PR dumping without substantive code changes (e.g., 50 PRs with 1 line whitespace)
 */
export function analyzeAntiGaming(data: RawDeveloperData): AntiGamingAudit {
  const auditNotes: string[] = [];
  let scoreDampeningApplied = 0;

  // 1. Check for single-day commit spam vs total activity
  let commitSpamDetected = false;
  const weeklyCounts = data.commitActivity?.weeklyCommitCounts || [];
  const totalCommits = data.commitActivity?.totalCommitsPastYear || 0;
  const maxWeeklyCommits = weeklyCounts.length > 0 ? Math.max(...weeklyCounts) : 0;

  if (totalCommits > 100 && maxWeeklyCommits > 0.85 * totalCommits && data.pullRequests.length === 0) {
    commitSpamDetected = true;
    scoreDampeningApplied += 15;
    auditNotes.push('Disproportionate single-week commit spike detected with zero PR activity.');
  }

  // 2. Check for fork spam (hundreds of forked repos with no original contributions)
  let forkSpamDetected = false;
  const totalRepos = data.repos.length;
  const forkedRepos = data.repos.filter(r => r.isFork).length;
  const originalRepos = totalRepos - forkedRepos;

  if (totalRepos > 20 && (forkedRepos / totalRepos) > 0.90 && originalRepos <= 1) {
    forkSpamDetected = true;
    scoreDampeningApplied += 10;
    auditNotes.push('High proportion (>90%) of non-contributed forked repositories.');
  }

  // 3. Check for trivial PR dumping (e.g. dozens of PRs with <= 1 changed lines)
  let prDumpDetected = false;
  const prs = data.pullRequests || [];
  if (prs.length >= 10) {
    const microPRs = prs.filter(pr => (pr.additions + pr.deletions) <= 2).length;
    if (microPRs / prs.length > 0.7) {
      prDumpDetected = true;
      scoreDampeningApplied += 15;
      auditNotes.push('High volume of trivial micro-PRs (<2 lines) detected.');
    }
  }

  if (auditNotes.length === 0) {
    auditNotes.push('Clean activity pattern. No artificial gaming signatures detected.');
  }

  return {
    commitSpamDetected,
    forkSpamDetected,
    prDumpDetected,
    scoreDampeningApplied: Math.min(scoreDampeningApplied, 35),
    auditNotes,
  };
}
