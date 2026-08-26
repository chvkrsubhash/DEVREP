export type DataMode = 'public' | 'private-inclusive';
export type ReputationTier = 'Novice Explorer' | 'Active Contributor' | 'Core Crafter' | 'System Architect' | 'Open-Source Luminary';
export interface SubScores {
    impact: number;
    collaboration: number;
    consistency: number;
    breadth: number;
    quality: number;
}
export interface MetricBreakdown {
    impact: {
        originalStars: number;
        originalForks: number;
        recencyWeightFactor: number;
        topStarredRepos: Array<{
            name: string;
            stars: number;
            isFork: boolean;
            isPrivate?: boolean;
        }>;
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
        weeklyCadenceEntropy: number;
        recentYearCommitTotal: number;
    };
    breadth: {
        primaryLanguages: Array<{
            language: string;
            bytes: number;
            percentage: number;
        }>;
        externalContributionsCount: number;
        ecosystemEntropy: number;
    };
    quality: {
        averagePRAdditions: number;
        averagePRDeletions: number;
        prSizeScore: number;
        revertPRCount: number;
        estimatedRevertRate: number;
    };
}
export interface AntiGamingAudit {
    commitSpamDetected: boolean;
    forkSpamDetected: boolean;
    prDumpDetected: boolean;
    scoreDampeningApplied: number;
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
    overallScore: number;
    tier: ReputationTier;
    tierDescription: string;
    subScores: SubScores;
    breakdown: MetricBreakdown;
    antiGaming: AntiGamingAudit;
    meta: {
        publicRepoCount: number;
        privateRepoCountAnalyzed?: number;
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
