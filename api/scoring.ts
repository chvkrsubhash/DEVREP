import {
  RawDeveloperData,
  ReputationScoreResult,
  ScoreBreakdown,
  AntiGamingFlag,
} from '../src/types/shared';

export const SCORE_WEIGHTS = {
  CODE_IMPACT: 0.30,
  COLLABORATION: 0.25,
  CADENCE_CONSISTENCY: 0.20,
  BREADTH: 0.15,
  CODE_QUALITY: 0.10,
};

function sigmoid(x: number, k: number = 1, x0: number = 0): number {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

function logarithmicScale(value: number, targetMax: number, maxScore: number = 100): number {
  if (value <= 0) return 0;
  const scaled = (Math.log10(value + 1) / Math.log10(targetMax + 1)) * maxScore;
  return Math.min(maxScore, Math.max(0, scaled));
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function detectAntiGamingAnomalies(data: RawDeveloperData): AntiGamingFlag[] {
  const flags: AntiGamingFlag[] = [];
  const repos = data.repositories || [];
  const contributions = data.contributions;

  // Check automated commit bursts
  const commitCount = contributions.totalCommitContributions;
  const daysInYear = 365;
  const avgCommitsPerDay = commitCount / daysInYear;
  if (avgCommitsPerDay > 40) {
    flags.push({
      ruleId: 'HIGH_VELOCITY_COMMIT_BURST',
      name: 'Automated / Bot-like Commit Velocity',
      severity: 'high',
      description: `Detected abnormally high commit rate averaging ${roundToTwo(avgCommitsPerDay)} commits/day. Likely automated workflow or micro-commit script.`,
      scorePenaltyPercentage: 35,
    });
  }

  // Check fork-only activity
  const originalRepos = repos.filter(r => !r.isFork);
  if (repos.length >= 5 && originalRepos.length === 0) {
    flags.push({
      ruleId: 'FORK_FARMING_DETECTION',
      name: 'Exclusively Forked Repositories',
      severity: 'medium',
      description: 'All listed repositories are forks with zero original creation footprints.',
      scorePenaltyPercentage: 20,
    });
  }

  // Check commit message quality
  const trivialPatterns = /^(update|fix|test|wip|changes|bump|typo|\.)$/i;
  const sampleMessages = contributions.recentCommitMessages || [];
  if (sampleMessages.length >= 10) {
    const trivialCount = sampleMessages.filter(m => trivialPatterns.test(m.trim())).length;
    const trivialRatio = trivialCount / sampleMessages.length;
    if (trivialRatio > 0.6) {
      flags.push({
        ruleId: 'TRIVIAL_COMMIT_MESSAGE_PATTERN',
        name: 'Low-Entropy / Repetitive Commit Messages',
        severity: 'low',
        description: `${Math.round(trivialRatio * 100)}% of recent commits contain generic single-word messages.`,
        scorePenaltyPercentage: 10,
      });
    }
  }

  // Check empty repos
  const emptyRepos = repos.filter(r => r.stargazerCount === 0 && r.forkCount === 0 && r.languages.length === 0);
  if (repos.length >= 6 && (emptyRepos.length / repos.length) > 0.7) {
    flags.push({
      ruleId: 'EMPTY_REPO_GENERATION',
      name: 'High Ratio of Dormant / Template Repositories',
      severity: 'medium',
      description: `${Math.round((emptyRepos.length / repos.length) * 100)}% of repositories contain no stars, forks, or language code footprints.`,
      scorePenaltyPercentage: 15,
    });
  }

  return flags;
}

export function computeDeveloperReputation(
  data: RawDeveloperData,
  mode: 'public' | 'private-inclusive'
): ReputationScoreResult {
  const startTime = Date.now();
  const repos = data.repositories || [];
  const contributions = data.contributions;

  // 1. Code Impact
  const totalStars = repos.reduce((acc, r) => acc + (r.stargazerCount || 0), 0);
  const totalForks = repos.reduce((acc, r) => acc + (r.forkCount || 0), 0);
  const starScore = logarithmicScale(totalStars, 1000, 50);
  const forkScore = logarithmicScale(totalForks, 300, 30);
  const mergedPrScore = logarithmicScale(contributions.totalPullRequestReviewContributions || 0, 50, 20);
  const rawCodeImpact = Math.min(100, starScore + forkScore + mergedPrScore);

  // 2. Collaboration
  const prScore = logarithmicScale(contributions.totalPullRequestContributions || 0, 80, 45);
  const reviewScore = logarithmicScale(contributions.totalPullRequestReviewContributions || 0, 60, 35);
  const issueScore = logarithmicScale(contributions.totalIssueContributions || 0, 50, 20);
  const rawCollaboration = Math.min(100, prScore + reviewScore + issueScore);

  // 3. Cadence Consistency
  const weeks = contributions.weeklyCommitCounts || [];
  const activeWeeks = weeks.filter(w => w > 0).length;
  const activeWeekScore = (activeWeeks / Math.max(1, weeks.length || 52)) * 60;
  const mean = weeks.length ? weeks.reduce((a, b) => a + b, 0) / weeks.length : 0;
  const variance = weeks.length ? weeks.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / weeks.length : 0;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 2;
  const consistencyFactor = Math.max(0, 1 - Math.min(1, coefficientOfVariation / 2)) * 40;
  const rawConsistency = Math.min(100, activeWeekScore + consistencyFactor);

  // 4. Breadth
  const langSet = new Set<string>();
  repos.forEach(r => (r.languages || []).forEach(l => langSet.add(l.name)));
  const languageCountScore = Math.min(60, langSet.size * 12);
  const originalCount = repos.filter(r => !r.isFork).length;
  const domainScore = logarithmicScale(originalCount, 15, 40);
  const rawBreadth = Math.min(100, languageCountScore + domainScore);

  // 5. Code Quality
  const hasLicenses = repos.filter(r => r.licenseInfo?.name).length;
  const licenseRatio = repos.length > 0 ? hasLicenses / repos.length : 0;
  const licenseScore = licenseRatio * 40;
  const hasDescriptions = repos.filter(r => r.description && r.description.length > 15).length;
  const descRatio = repos.length > 0 ? hasDescriptions / repos.length : 0;
  const documentationScore = descRatio * 35;
  const maintenanceScore = Math.min(25, repos.filter(r => {
    const updatedDaysAgo = (Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return updatedDaysAgo < 180;
  }).length * 5);
  const rawQuality = Math.min(100, licenseScore + documentationScore + maintenanceScore);

  // Anti-Gaming Penalty
  const antiGamingFlags = detectAntiGamingAnomalies(data);
  const totalPenaltyPct = Math.min(80, antiGamingFlags.reduce((acc, f) => acc + f.scorePenaltyPercentage, 0));
  const penaltyMultiplier = (100 - totalPenaltyPct) / 100;

  const subScores: ScoreBreakdown = {
    codeImpact: roundToTwo(rawCodeImpact * penaltyMultiplier),
    collaboration: roundToTwo(rawCollaboration * penaltyMultiplier),
    cadenceConsistency: roundToTwo(rawConsistency * penaltyMultiplier),
    breadth: roundToTwo(rawBreadth * penaltyMultiplier),
    codeQuality: roundToTwo(rawQuality * penaltyMultiplier),
  };

  const weightedSum =
    subScores.codeImpact * SCORE_WEIGHTS.CODE_IMPACT +
    subScores.collaboration * SCORE_WEIGHTS.COLLABORATION +
    subScores.cadenceConsistency * SCORE_WEIGHTS.CADENCE_CONSISTENCY +
    subScores.breadth * SCORE_WEIGHTS.BREADTH +
    subScores.codeQuality * SCORE_WEIGHTS.CODE_QUALITY;

  const overallScore = Math.round(weightedSum);

  const topRepos = repos
    .slice()
    .sort((a, b) => ((b.stargazerCount || 0) + (b.forkCount || 0) * 2) - ((a.stargazerCount || 0) + (a.forkCount || 0) * 2))
    .slice(0, 5);

  const insights: string[] = [];
  if (subScores.codeImpact > 75) insights.push('Outstanding community adoption and high open-source repository impact.');
  if (subScores.collaboration > 75) insights.push('Top-tier peer collaboration with strong pull request and code review activity.');
  if (subScores.cadenceConsistency > 75) insights.push('Highly steady week-over-week development frequency with low burnout variance.');
  if (subScores.breadth > 75) insights.push('Polyglot expertise spanning multiple programming languages and distinct project domains.');
  if (subScores.codeQuality > 75) insights.push('Well-documented repositories with clear licenses and active maintenance.');
  if (insights.length === 0) insights.push('Steady contributor with emerging developer reputation and ongoing project activity.');

  return {
    username: data.user.login,
    overallScore,
    subScores,
    insights,
    antiGamingFlags,
    metadata: {
      avatarUrl: data.user.avatarUrl,
      bio: data.user.bio,
      company: data.user.company,
      location: data.user.location,
      publicRepoCount: data.user.publicRepoCount,
      followerCount: data.user.followerCount,
      topRepositories: topRepos,
      languages: Array.from(langSet).slice(0, 8),
    },
    meta: {
      mode,
      computedAt: new Date().toISOString(),
      executionDurationMs: Date.now() - startTime,
      repositoriesAnalyzed: repos.length,
    },
  };
}
