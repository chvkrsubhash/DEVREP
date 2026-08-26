import { describe, it, expect } from 'vitest';
import {
  computeDeveloperReputation,
  computeImpact,
  computeCollaboration,
  computeConsistency,
  computeBreadth,
  computeQuality,
} from '../engine';
import { RawDeveloperData } from '../types';

describe('DevRep Scoring Engine', () => {
  const mockNow = new Date('2026-08-26T00:00:00Z');

  it('should compute scores strictly between 0 and 100 for zero-activity profile', () => {
    const emptyDev: RawDeveloperData = {
      username: 'emptyuser',
      avatarUrl: 'https://github.com/ghost.png',
      publicRepoCount: 0,
      repos: [],
      pullRequests: [],
      reviewsGiven: [],
      issuesInvolved: [],
      commitActivity: {
        weeklyCommitCounts: new Array(52).fill(0),
        totalCommitsPastYear: 0,
      },
    };

    const result = computeDeveloperReputation(emptyDev, 'public', mockNow);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.subScores.impact).toBe(0);
    expect(result.subScores.collaboration).toBe(0);
    expect(result.subScores.consistency).toBe(0);
    expect(result.tier).toBe('Novice Explorer');
    expect(result.meta.privateRepoCountAnalyzed).toBeUndefined();
  });

  it('should correctly score a prolific Open-Source Luminary maintainer', () => {
    const luminaryDev: RawDeveloperData = {
      username: 'linus-style',
      name: 'Senior Architect',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      publicRepoCount: 45,
      repos: [
        {
          name: 'kernel-framework',
          isFork: false,
          isPrivate: false,
          stargazerCount: 15000,
          forkCount: 3200,
          primaryLanguage: 'TypeScript',
          languages: [
            { name: 'TypeScript', size: 1200000 },
            { name: 'Rust', size: 850000 },
            { name: 'C', size: 400000 },
          ],
          updatedAt: '2026-08-20T00:00:00Z',
          createdAt: '2020-01-01T00:00:00Z',
        },
        {
          name: 'async-runtime',
          isFork: false,
          isPrivate: false,
          stargazerCount: 4200,
          forkCount: 750,
          primaryLanguage: 'Rust',
          languages: [
            { name: 'Rust', size: 950000 },
            { name: 'Python', size: 200000 },
          ],
          updatedAt: '2026-08-15T00:00:00Z',
          createdAt: '2022-03-01T00:00:00Z',
        },
      ],
      pullRequests: [
        {
          id: 'pr-1',
          title: 'feat: zero-copy stream pipeline',
          state: 'MERGED',
          merged: true,
          additions: 120,
          deletions: 40,
          changedFiles: 5,
          isFork: false,
          isExternalOrg: true,
          createdAt: '2026-07-01T00:00:00Z',
        },
        {
          id: 'pr-2',
          title: 'perf: optimize memory layout',
          state: 'MERGED',
          merged: true,
          additions: 250,
          deletions: 90,
          changedFiles: 8,
          isFork: false,
          isExternalOrg: true,
          createdAt: '2026-07-15T00:00:00Z',
        },
        {
          id: 'pr-3',
          title: 'fix: edge case buffer boundary',
          state: 'MERGED',
          merged: true,
          additions: 35,
          deletions: 12,
          changedFiles: 2,
          isFork: false,
          isExternalOrg: false,
          createdAt: '2026-08-01T00:00:00Z',
        },
      ],
      reviewsGiven: new Array(35).fill(0).map((_, i) => ({
        id: `rev-${i}`,
        state: 'APPROVED',
        submittedAt: '2026-07-01T00:00:00Z',
        repositoryOwner: 'top-org',
      })),
      issuesInvolved: new Array(25).fill(0).map((_, i) => ({
        id: `iss-${i}`,
        state: 'CLOSED',
        createdAt: '2026-06-01T00:00:00Z',
      })),
      commitActivity: {
        weeklyCommitCounts: new Array(52).fill(12), // Rock-solid steady weekly cadence
        totalCommitsPastYear: 624,
      },
    };

    const result = computeDeveloperReputation(luminaryDev, 'public', mockNow);

    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.tier).toBe('Open-Source Luminary');
    expect(result.subScores.impact).toBeGreaterThan(85);
    expect(result.subScores.consistency).toBeGreaterThan(80);
    expect(result.antiGaming.commitSpamDetected).toBe(false);
    expect(result.antiGaming.scoreDampeningApplied).toBe(0);
  });

  it('should detect and penalize artificial commit spam bursts (anti-gaming)', () => {
    const spamDev: RawDeveloperData = {
      username: 'botspammer',
      avatarUrl: 'https://github.com/bot.png',
      publicRepoCount: 2,
      repos: [
        {
          name: 'spam-repo',
          isFork: false,
          isPrivate: false,
          stargazerCount: 0,
          forkCount: 0,
          primaryLanguage: 'Python',
          languages: [{ name: 'Python', size: 5000 }],
          updatedAt: '2026-08-25T00:00:00Z',
          createdAt: '2026-08-20T00:00:00Z',
        },
      ],
      pullRequests: [],
      reviewsGiven: [],
      issuesInvolved: [],
      commitActivity: {
        // 1 week has 500 commits, all other weeks have 0
        weeklyCommitCounts: [500, ...new Array(51).fill(0)],
        totalCommitsPastYear: 500,
      },
    };

    const result = computeDeveloperReputation(spamDev, 'public', mockNow);

    expect(result.antiGaming.commitSpamDetected).toBe(true);
    expect(result.antiGaming.scoreDampeningApplied).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(35);
  });

  it('should discount forked repositories in code impact score', () => {
    const reposWithForksOnly = [
      {
        name: 'forked-react',
        isFork: true,
        isPrivate: false,
        stargazerCount: 220000,
        forkCount: 45000,
        primaryLanguage: 'JavaScript',
        languages: [{ name: 'JavaScript', size: 1000000 }],
        updatedAt: '2026-08-20T00:00:00Z',
        createdAt: '2020-01-01T00:00:00Z',
      },
    ];

    const impact = computeImpact(reposWithForksOnly, mockNow);
    // Forked repos should yield 0 original impact points
    expect(impact.score).toBe(0);
    expect(impact.breakdown.originalStars).toBe(0);
  });

  it('should reward optimal PR sizing and penalize massive monolithic dumps', () => {
    const cleanPRs = [
      {
        id: '1',
        title: 'feat: add metrics aggregation',
        state: 'MERGED' as const,
        merged: true,
        additions: 120,
        deletions: 40,
        changedFiles: 4,
        isFork: false,
        isExternalOrg: false,
        createdAt: '2026-08-01T00:00:00Z',
      },
    ];

    const giantDumpPRs = [
      {
        id: '2',
        title: 'dump: dump entire vendor tree',
        state: 'MERGED' as const,
        merged: true,
        additions: 15000,
        deletions: 8000,
        changedFiles: 140,
        isFork: false,
        isExternalOrg: false,
        createdAt: '2026-08-01T00:00:00Z',
      },
    ];

    const cleanQuality = computeQuality(cleanPRs);
    const dumpQuality = computeQuality(giantDumpPRs);

    expect(cleanQuality.score).toBeGreaterThan(dumpQuality.score);
    expect(cleanQuality.breakdown.prSizeScore).toBe(100);
  });

  it('should include private repo count in meta only when in private-inclusive mode', () => {
    const dev: RawDeveloperData = {
      username: 'alice',
      avatarUrl: 'https://github.com/alice.png',
      publicRepoCount: 10,
      privateRepoCount: 5,
      repos: [],
      pullRequests: [],
      reviewsGiven: [],
      issuesInvolved: [],
      commitActivity: {
        weeklyCommitCounts: new Array(52).fill(1),
        totalCommitsPastYear: 52,
      },
    };

    const publicResult = computeDeveloperReputation(dev, 'public', mockNow);
    expect(publicResult.dataMode).toBe('public');
    expect(publicResult.meta.privateRepoCountAnalyzed).toBeUndefined();

    const privateResult = computeDeveloperReputation(dev, 'private-inclusive', mockNow);
    expect(privateResult.dataMode).toBe('private-inclusive');
    expect(privateResult.meta.privateRepoCountAnalyzed).toBe(5);
  });
});
