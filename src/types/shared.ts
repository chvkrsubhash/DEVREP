export type DataMode = 'public' | 'private-inclusive';

export type ReputationTier =
  | 'Novice Explorer'     // 0 - 29
  | 'Active Contributor'  // 30 - 49
  | 'Core Crafter'        // 50 - 69
  | 'System Architect'    // 70 - 84
  | 'Open-Source Luminary';// 85 - 100

export interface SubScores {
  impact: number;        // Stars, forks, organic reach (recency weighted)
  collaboration: number; // Merged PR ratio, reviews given, issue resolution
  consistency: number;   // Active week distribution, commit cadence entropy
  breadth: number;       // Multi-language diversity, external repo contributions
  quality: number;       // PR size sweet spot, revert/rollback rate, CI signals
}

export interface MetricBreakdown {
  impact: {
    originalStars: number;
    originalForks: number;
    recencyWeightFactor: number;
    topStarredRepos: Array<{ name: string; stars: number; isFork: boolean; isPrivate?: boolean }>;
  };
  collaboration: {
    totalPRsCreated: number;
    mergedPRsCount: number;
    mergedRatio: number;
    codeReviewsGiven: number;
    issuesInvolved: number;
  };
  consistency: {
    activeWeeksInLastYear: number;
    longestStreakWeeks: number;
    weeklyCadenceEntropy: number; // Low variance across weeks = high consistency
    recentYearCommitTotal: number;
  };
  breadth: {
    primaryLanguages: Array<{ language: string; bytes: number; percentage: number }>;
    externalContributionsCount: number;
    ecosystemEntropy: number;
  };
  quality: {
    averagePRAdditions: number;
    averagePRDeletions: number;
    prSizeScore: number; // Penalizes giant monolithic diffs, rewards digestible PRs
    revertPRCount: number;
    estimatedRevertRate: number;
  };
}

export interface AntiGamingAudit {
  commitSpamDetected: boolean;
  forkSpamDetected: boolean;
  prDumpDetected: boolean;
  scoreDampeningApplied: number; // Percentage penalty if suspicious patterns detected
  auditNotes: string[];
}

export interface ReputationScoreResult {
  username: string;
  avatarUrl: string;
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  dataMode: DataMode;
  overallScore: number; // 0 - 100
  tier: ReputationTier;
  tierDescription: string;
  subScores: SubScores;
  breakdown: MetricBreakdown;
  antiGaming: AntiGamingAudit;
  meta: {
    publicRepoCount: number;
    privateRepoCountAnalyzed?: number; // Only present in private-inclusive mode
    computedAt: string;
    cached: boolean;
  };
}

export interface HistoricalSnapshot {
  id?: string;
  overallScore: number;
  subScores: SubScores;
  dataMode: DataMode;
  computedAt: string;
}

export interface UserSession {
  id: string;
  githubId: string;
  username: string;
  avatarUrl?: string;
  hasPrivateAccess: boolean;
  createdAt: string;
}

export interface PublicUserSummary {
  username: string;
  avatarUrl: string;
  overallScore: number;
  tier: ReputationTier;
  computedAt: string;
}
