/**
 * DevRep Scoring Engine Weights & Coefficients
 * Designed to balance organic reach, collaboration, and high-quality craftsmanship
 * while penalizing artificial activity farming.
 */

export const SCORING_WEIGHTS = {
  // Composite score overall weights (sum to 1.0)
  overall: {
    impact: 0.25,        // 25% Code Reach & Adoption
    collaboration: 0.25, // 25% Teamwork, PRs & Reviews
    consistency: 0.20,   // 20% Steady Cadence (not burst spam)
    breadth: 0.15,       // 15% Language Diversity & External contributions
    quality: 0.15,       // 15% PR sizing, low revert rates, hygiene
  },

  // Impact tuning parameters
  impact: {
    starBaseLogWeight: 18.0, // log10(stars + 1) * weight
    forkBaseLogWeight: 12.0,
    recencyHalfLifeDays: 365, // Activity in the past 365 days gets higher weight
    maxScore: 100,
  },

  // Collaboration tuning parameters
  collaboration: {
    prMergeRateWeight: 35,     // High merged PR ratio
    reviewParticipationWeight: 35, // High code reviews given
    issueResolutionWeight: 30, // Issue triage/engagement
    minPRThreshold: 3,         // Threshold to establish confidence in ratio
  },

  // Consistency tuning parameters
  consistency: {
    activeWeekWeight: 45,      // Ratio of 52 weeks with >=1 commit
    cadenceEntropyWeight: 35,  // Evenness of weekly distribution
    streakBonusWeight: 20,     // Steady streak bonus
  },

  // Breadth tuning parameters
  breadth: {
    languageEntropyWeight: 50, // Shannon entropy over languages
    externalContribWeight: 50, // Contributions to non-self repos/orgs
  },

  // Quality tuning parameters
  quality: {
    prSizeSweetSpotMin: 20,    // Lines added/deleted minimum for substance
    prSizeSweetSpotMax: 450,   // Lines added/deleted maximum for digestability
    prSizeWeight: 50,
    revertPenaltyWeight: 30,
    cleanMergeWeight: 20,
  },
};
