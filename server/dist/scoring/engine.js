"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeImpact = computeImpact;
exports.computeCollaboration = computeCollaboration;
exports.computeConsistency = computeConsistency;
exports.computeBreadth = computeBreadth;
exports.computeQuality = computeQuality;
exports.getTier = getTier;
exports.computeDeveloperReputation = computeDeveloperReputation;
const weights_1 = require("./weights");
const antiGaming_1 = require("./antiGaming");
/**
 * Calculates Code Impact Score (0 - 100)
 * Evaluates stars and forks on original repositories, weighted by recency decay.
 */
function computeImpact(repos, now = new Date()) {
    const originalRepos = repos.filter(r => !r.isFork);
    let totalWeightedStarPoints = 0;
    let totalWeightedForkPoints = 0;
    let totalOriginalStars = 0;
    let totalOriginalForks = 0;
    const topStarredRepos = [];
    for (const repo of originalRepos) {
        totalOriginalStars += repo.stargazerCount;
        totalOriginalForks += repo.forkCount;
        // Calculate recency decay (half-life of 365 days)
        const updatedTime = new Date(repo.updatedAt).getTime();
        const daysSinceUpdate = Math.max(0, (now.getTime() - updatedTime) / (1000 * 60 * 60 * 24));
        const recencyFactor = Math.max(0.3, Math.exp(-Math.LN2 * (daysSinceUpdate / weights_1.SCORING_WEIGHTS.impact.recencyHalfLifeDays)));
        // Logarithmic scaling for stars and forks
        const starPts = Math.log10(repo.stargazerCount + 1) * weights_1.SCORING_WEIGHTS.impact.starBaseLogWeight * recencyFactor;
        const forkPts = Math.log10(repo.forkCount + 1) * weights_1.SCORING_WEIGHTS.impact.forkBaseLogWeight * recencyFactor;
        totalWeightedStarPoints += starPts;
        totalWeightedForkPoints += forkPts;
        topStarredRepos.push({
            name: repo.name,
            stars: repo.stargazerCount,
            isFork: repo.isFork,
            isPrivate: repo.isPrivate,
        });
    }
    topStarredRepos.sort((a, b) => b.stars - a.stars);
    const rawScore = totalWeightedStarPoints + totalWeightedForkPoints;
    // Non-linear compression to guarantee strict 0 - 100 bounds
    const normalizedScore = Math.min(100, Math.round(100 * (1 - Math.exp(-rawScore / 45))));
    return {
        score: Math.max(0, normalizedScore),
        breakdown: {
            originalStars: totalOriginalStars,
            originalForks: totalOriginalForks,
            recencyWeightFactor: Number((totalWeightedStarPoints / Math.max(1, totalOriginalStars || 1)).toFixed(2)),
            topStarredRepos: topStarredRepos.slice(0, 5),
        },
    };
}
/**
 * Calculates Collaboration Score (0 - 100)
 * Evaluates merged PR ratio, code reviews submitted, and issue triage.
 */
function computeCollaboration(data) {
    const prs = data.pullRequests || [];
    const totalPRs = prs.length;
    const mergedPRs = prs.filter(p => p.merged || p.state === 'MERGED').length;
    const reviewsCount = (data.reviewsGiven || []).length;
    const issuesCount = (data.issuesInvolved || []).length;
    const rawMergedRatio = totalPRs > 0 ? mergedPRs / totalPRs : 0;
    // Dampen ratio if sample size is very low
    const confidenceFactor = Math.min(1, totalPRs / weights_1.SCORING_WEIGHTS.collaboration.minPRThreshold);
    const effectiveMergeRatio = rawMergedRatio * confidenceFactor;
    const prPoints = effectiveMergeRatio * weights_1.SCORING_WEIGHTS.collaboration.prMergeRateWeight;
    // Code reviews scaling: 10 reviews ~ 25 pts, 30+ reviews ~ 35 pts
    const reviewPoints = Math.min(weights_1.SCORING_WEIGHTS.collaboration.reviewParticipationWeight, Math.log2(reviewsCount + 1) * 7.0);
    // Issue participation scaling
    const issuePoints = Math.min(weights_1.SCORING_WEIGHTS.collaboration.issueResolutionWeight, Math.log2(issuesCount + 1) * 6.0);
    const totalScore = Math.min(100, Math.round(prPoints + reviewPoints + issuePoints));
    return {
        score: Math.max(0, totalScore),
        breakdown: {
            totalPRsCreated: totalPRs,
            mergedPRsCount: mergedPRs,
            mergedRatio: Number(rawMergedRatio.toFixed(2)),
            codeReviewsGiven: reviewsCount,
            issuesInvolved: issuesCount,
        },
    };
}
/**
 * Calculates Consistency Score (0 - 100)
 * Evaluates cadence entropy and active weeks across 52 weeks, rather than burst spam.
 */
function computeConsistency(data) {
    const weekly = data.commitActivity?.weeklyCommitCounts || [];
    const totalCommits = data.commitActivity?.totalCommitsPastYear || weekly.reduce((a, b) => a + b, 0);
    let activeWeeks = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    for (const count of weekly) {
        if (count > 0) {
            activeWeeks++;
            currentStreak++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        }
        else {
            currentStreak = 0;
        }
    }
    // Active weeks score (out of 45 pts)
    const activeWeeksRatio = weekly.length > 0 ? activeWeeks / weekly.length : 0;
    const activeWeekPoints = activeWeeksRatio * weights_1.SCORING_WEIGHTS.consistency.activeWeekWeight;
    // Cadence entropy: measures how evenly commits are distributed across active weeks
    let entropy = 0;
    if (totalCommits > 0 && weekly.length > 0) {
        for (const count of weekly) {
            if (count > 0) {
                const p = count / totalCommits;
                entropy -= p * Math.log2(p);
            }
        }
    }
    const maxPossibleEntropy = weekly.length > 0 ? Math.log2(weekly.length) : 1;
    const normalizedEntropy = maxPossibleEntropy > 0 ? entropy / maxPossibleEntropy : 0;
    const entropyPoints = normalizedEntropy * weights_1.SCORING_WEIGHTS.consistency.cadenceEntropyWeight;
    // Streak bonus (out of 20 pts)
    const streakPoints = Math.min(weights_1.SCORING_WEIGHTS.consistency.streakBonusWeight, (longestStreak / 26) * weights_1.SCORING_WEIGHTS.consistency.streakBonusWeight);
    const totalScore = Math.min(100, Math.round(activeWeekPoints + entropyPoints + streakPoints));
    return {
        score: Math.max(0, totalScore),
        breakdown: {
            activeWeeksInLastYear: activeWeeks,
            longestStreakWeeks: longestStreak,
            weeklyCadenceEntropy: Number(normalizedEntropy.toFixed(2)),
            recentYearCommitTotal: totalCommits,
        },
    };
}
/**
 * Calculates Breadth Score (0 - 100)
 * Evaluates language diversity across repositories and external contribution breadth.
 */
function computeBreadth(data) {
    const languageBytesMap = new Map();
    let totalBytes = 0;
    for (const repo of data.repos) {
        for (const lang of repo.languages || []) {
            const current = languageBytesMap.get(lang.name) || 0;
            languageBytesMap.set(lang.name, current + lang.size);
            totalBytes += lang.size;
        }
    }
    const primaryLanguages = [];
    let languageEntropy = 0;
    if (totalBytes > 0) {
        for (const [name, bytes] of languageBytesMap.entries()) {
            const percentage = (bytes / totalBytes) * 100;
            const p = bytes / totalBytes;
            languageEntropy -= p * Math.log2(p);
            primaryLanguages.push({
                language: name,
                bytes,
                percentage: Number(percentage.toFixed(1)),
            });
        }
    }
    primaryLanguages.sort((a, b) => b.bytes - a.bytes);
    // Entropy normalized across languages
    const maxPossibleLangEntropy = Math.log2(Math.max(1, languageBytesMap.size));
    const normalizedLangEntropy = maxPossibleLangEntropy > 0 ? languageEntropy / maxPossibleLangEntropy : 0;
    const langPoints = Math.min(weights_1.SCORING_WEIGHTS.breadth.languageEntropyWeight, normalizedLangEntropy * weights_1.SCORING_WEIGHTS.breadth.languageEntropyWeight * (languageBytesMap.size > 1 ? 1 : 0.4));
    // External repository contributions
    const externalPRs = (data.pullRequests || []).filter(p => p.isExternalOrg || p.isFork).length;
    const externalPoints = Math.min(weights_1.SCORING_WEIGHTS.breadth.externalContribWeight, Math.log2(externalPRs + 1) * 12.0);
    const totalScore = Math.min(100, Math.round(langPoints + externalPoints));
    return {
        score: Math.max(0, totalScore),
        breakdown: {
            primaryLanguages: primaryLanguages.slice(0, 6),
            externalContributionsCount: externalPRs,
            ecosystemEntropy: Number(normalizedLangEntropy.toFixed(2)),
        },
    };
}
/**
 * Calculates Quality Signals Score (0 - 100)
 * Evaluates PR sizing discipline, low revert rate, and clean reviews.
 */
function computeQuality(prs) {
    if (!prs || prs.length === 0) {
        return {
            score: 50, // Neutral starting baseline for clean slate
            breakdown: {
                averagePRAdditions: 0,
                averagePRDeletions: 0,
                prSizeScore: 50,
                revertPRCount: 0,
                estimatedRevertRate: 0,
            },
        };
    }
    let totalAdditions = 0;
    let totalDeletions = 0;
    let revertCount = 0;
    for (const pr of prs) {
        totalAdditions += pr.additions;
        totalDeletions += pr.deletions;
        const lowerTitle = pr.title.toLowerCase();
        if (lowerTitle.includes('revert') || lowerTitle.includes('rollback') || lowerTitle.startsWith('undo')) {
            revertCount++;
        }
    }
    const avgAdd = Math.round(totalAdditions / prs.length);
    const avgDel = Math.round(totalDeletions / prs.length);
    const avgChanges = avgAdd + avgDel;
    // PR Sizing curve:
    // Optimal: 20 - 450 lines (100% of sizing pts)
    // Moderate: 450 - 1200 lines (gradual drop)
    // Unreviewed dumps: >2000 lines (drops down)
    let sizeScore = 50;
    if (avgChanges >= weights_1.SCORING_WEIGHTS.quality.prSizeSweetSpotMin && avgChanges <= weights_1.SCORING_WEIGHTS.quality.prSizeSweetSpotMax) {
        sizeScore = 100;
    }
    else if (avgChanges < weights_1.SCORING_WEIGHTS.quality.prSizeSweetSpotMin) {
        sizeScore = 65; // Trivial PRs
    }
    else {
        // Excessive monolith diffs
        const penalty = Math.min(75, Math.log10(avgChanges / weights_1.SCORING_WEIGHTS.quality.prSizeSweetSpotMax) * 45);
        sizeScore = Math.max(25, 100 - penalty);
    }
    const revertRate = prs.length > 0 ? revertCount / prs.length : 0;
    const revertPenalty = Math.min(weights_1.SCORING_WEIGHTS.quality.revertPenaltyWeight, revertRate * 100);
    const cleanMergeRatio = prs.filter(p => p.merged).length / Math.max(1, prs.length);
    const cleanMergePts = cleanMergeRatio * weights_1.SCORING_WEIGHTS.quality.cleanMergeWeight;
    const rawQuality = (sizeScore / 100) * weights_1.SCORING_WEIGHTS.quality.prSizeWeight + cleanMergePts - revertPenalty + 15;
    const finalQuality = Math.min(100, Math.max(0, Math.round(rawQuality)));
    return {
        score: finalQuality,
        breakdown: {
            averagePRAdditions: avgAdd,
            averagePRDeletions: avgDel,
            prSizeScore: Math.round(sizeScore),
            revertPRCount: revertCount,
            estimatedRevertRate: Number(revertRate.toFixed(3)),
        },
    };
}
/**
 * Maps composite score to human-readable Tier and descriptive summary.
 */
function getTier(score) {
    if (score >= 85) {
        return {
            tier: 'Open-Source Luminary',
            description: 'Prolific impact across high-adoption ecosystems, stellar craftsmanship, and active mentorship.',
        };
    }
    if (score >= 70) {
        return {
            tier: 'System Architect',
            description: 'High technical breadth, proven multi-project consistency, and seasoned review contributions.',
        };
    }
    if (score >= 50) {
        return {
            tier: 'Core Crafter',
            description: 'Solid code impact, dependable collaboration cadence, and robust PR quality hygiene.',
        };
    }
    if (score >= 30) {
        return {
            tier: 'Active Contributor',
            description: 'Regular open-source engagement with growing project breadth and collaboration.',
        };
    }
    return {
        tier: 'Novice Explorer',
        description: 'Emerging developer building foundational repositories and early contribution footprint.',
    };
}
/**
 * Main Pure Scoring Entrypoint:
 * Takes raw GitHub developer data & data mode -> Computes complete DevRep reputation score.
 */
function computeDeveloperReputation(data, mode = 'public', now = new Date()) {
    const impact = computeImpact(data.repos, now);
    const collaboration = computeCollaboration(data);
    const consistency = computeConsistency(data);
    const breadth = computeBreadth(data);
    const quality = computeQuality(data.pullRequests);
    const antiGaming = (0, antiGaming_1.analyzeAntiGaming)(data);
    const subScores = {
        impact: impact.score,
        collaboration: collaboration.score,
        consistency: consistency.score,
        breadth: breadth.score,
        quality: quality.score,
    };
    // Weighted composite sum
    const baseComposite = subScores.impact * weights_1.SCORING_WEIGHTS.overall.impact +
        subScores.collaboration * weights_1.SCORING_WEIGHTS.overall.collaboration +
        subScores.consistency * weights_1.SCORING_WEIGHTS.overall.consistency +
        subScores.breadth * weights_1.SCORING_WEIGHTS.overall.breadth +
        subScores.quality * weights_1.SCORING_WEIGHTS.overall.quality;
    // Apply anti-gaming dampening if flags were raised
    const dampeningMultiplier = (100 - antiGaming.scoreDampeningApplied) / 100;
    const rawFinalScore = Math.round(baseComposite * dampeningMultiplier);
    const overallScore = Math.max(0, Math.min(100, rawFinalScore));
    const { tier, description } = getTier(overallScore);
    const breakdown = {
        impact: impact.breakdown,
        collaboration: collaboration.breakdown,
        consistency: consistency.breakdown,
        breadth: breadth.breakdown,
        quality: quality.breakdown,
    };
    return {
        username: data.username,
        avatarUrl: data.avatarUrl,
        name: data.name,
        bio: data.bio,
        company: data.company,
        location: data.location,
        dataMode: mode,
        overallScore,
        tier,
        tierDescription: description,
        subScores,
        breakdown,
        antiGaming,
        meta: {
            publicRepoCount: data.publicRepoCount,
            privateRepoCountAnalyzed: mode === 'private-inclusive' ? data.privateRepoCount : undefined,
            computedAt: now.toISOString(),
            cached: false,
        },
    };
}
