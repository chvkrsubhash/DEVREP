export interface RawRepoData {
  name: string;
  isFork: boolean;
  isPrivate: boolean;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: string | null;
  languages: Array<{ name: string; size: number }>;
  updatedAt: string;
  createdAt: string;
}

export interface RawPullRequest {
  id: string;
  title: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  merged: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  isFork: boolean;
  isExternalOrg: boolean;
  createdAt: string;
  mergedAt?: string | null;
}

export interface RawReview {
  id: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
  submittedAt: string;
  repositoryOwner: string;
}

export interface RawIssue {
  id: string;
  state: 'OPEN' | 'CLOSED';
  closedAt?: string | null;
  createdAt: string;
}

export interface RawCommitActivity {
  weeklyCommitCounts: number[]; // Array of 52 weeks of commit counts
  totalCommitsPastYear: number;
  maxSingleDayCommits?: number;
}

export interface RawDeveloperData {
  username: string;
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  avatarUrl: string;
  publicRepoCount: number;
  privateRepoCount?: number;
  repos: RawRepoData[];
  pullRequests: RawPullRequest[];
  reviewsGiven: RawReview[];
  issuesInvolved: RawIssue[];
  commitActivity: RawCommitActivity;
}
