import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReputationScoreResult } from '../types/shared';

/**
 * Generates an executive-grade, professional clean white PDF Developer Reputation Report.
 * Designed with minimalist typography, crisp hairline tables, and refined accents.
 */
export function generateProfilePDF(score: ReputationScoreResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const textDark: [number, number, number] = [15, 23, 42];       // Slate 900
  const textMuted: [number, number, number] = [100, 116, 139];   // Slate 500
  const textIndigo: [number, number, number] = [67, 56, 202];    // Indigo 700
  const borderGrey: [number, number, number] = [226, 232, 240];  // Slate 200
  const bgLight: [number, number, number] = [248, 250, 252];     // Slate 50

  let currentY = 16;

  // 1. CLEAN EXECUTIVE HEADER (White background with crisp top accent line)
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.5);
  doc.line(14, currentY, 196, currentY); // Top subtle accent line

  currentY += 8;

  // Header Brand & Verification Info
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('DEVREP', 14, currentY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('GitHub Developer Reputation Audit', 42, currentY);

  doc.setFontSize(8.5);
  doc.text('Official Verification: https://devrep.app', 196, currentY, { align: 'right' });

  currentY += 6;
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, 196, currentY);

  currentY += 10;

  // 2. CANDIDATE & SCORE OVERVIEW CONTAINER
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(14, currentY, 182, 36, 3, 3, 'FD');

  // Left: Developer Identity
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(score.name || score.username, 20, currentY + 9);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textIndigo);
  doc.text(`@${score.username}`, 20, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  const auditType = score.dataMode === 'private-inclusive' ? 'Private-Inclusive Audit' : 'Public Profile Audit';
  doc.text(`${auditType}  •  ${score.meta.publicRepoCount} Public Repos  •  Generated ${new Date(score.meta.computedAt).toLocaleDateString()}`, 20, currentY + 21);

  if (score.bio) {
    const splitBio = doc.splitTextToSize(score.bio, 115);
    doc.text(splitBio.slice(0, 2), 20, currentY + 27);
  }

  // Right: Overall Score Badge Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(144, currentY + 4, 46, 28, 2, 2, 'FD');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(`${score.overallScore}`, 167, currentY + 18, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('OVERALL SCORE / 100', 167, currentY + 26, { align: 'center' });

  currentY += 42;

  // 3. REPUTATION TIER BANNER
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, currentY, 182, 10, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text(`VERIFIED TIER: ${score.tier.toUpperCase()}`, 19, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text(`— ${score.tierDescription}`, 75, currentY + 6.5);

  currentY += 16;

  // 4. 5-DIMENSIONAL REPUTATION MATRIX TABLE
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('1. 5-Dimensional Reputation Matrix', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Pillar Dimension', 'Score', 'Key Metrics Analyzed', 'Rating']],
    body: [
      [
        'Code Impact',
        `${score.subScores.impact}/100`,
        `${score.breakdown.impact.originalStars.toLocaleString()} original stars, ${score.breakdown.impact.originalForks.toLocaleString()} forks (recency-weighted)`,
        score.subScores.impact >= 75 ? 'Exceptional' : score.subScores.impact >= 50 ? 'Strong' : 'Standard',
      ],
      [
        'Collaboration',
        `${score.subScores.collaboration}/100`,
        `${Math.round(score.breakdown.collaboration.mergedRatio * 100)}% PR merge rate (${score.breakdown.collaboration.mergedPRsCount}/${score.breakdown.collaboration.totalPRsCreated}), ${score.breakdown.collaboration.codeReviewsGiven} code reviews given`,
        score.subScores.collaboration >= 75 ? 'Exceptional' : score.subScores.collaboration >= 50 ? 'Strong' : 'Standard',
      ],
      [
        'Cadence Consistency',
        `${score.subScores.consistency}/100`,
        `${score.breakdown.consistency.activeWeeksInLastYear}/52 active weeks, ${score.breakdown.consistency.longestStreakWeeks} weeks consecutive streak`,
        score.subScores.consistency >= 75 ? 'Exceptional' : score.subScores.consistency >= 50 ? 'Strong' : 'Standard',
      ],
      [
        'Ecosystem Breadth',
        `${score.subScores.breadth}/100`,
        `${score.breakdown.breadth.primaryLanguages.slice(0, 3).map(l => l.language).join(', ') || 'Multi-stack'}, ${score.breakdown.breadth.externalContributionsCount} external repo contributions`,
        score.subScores.breadth >= 75 ? 'Exceptional' : score.subScores.breadth >= 50 ? 'Strong' : 'Standard',
      ],
      [
        'Quality & Hygiene',
        `${score.subScores.quality}/100`,
        `+${score.breakdown.quality.averagePRAdditions}/-${score.breakdown.quality.averagePRDeletions} avg diffs, ${score.breakdown.quality.revertPRCount} rollback/reverts`,
        score.subScores.quality >= 75 ? 'Exceptional' : score.subScores.quality >= 50 ? 'Strong' : 'Standard',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { fontStyle: 'bold', textColor: [67, 56, 202], cellWidth: 22 },
      2: { cellWidth: 92 },
      3: { cellWidth: 30, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. REPOSITORIES DETAILS TABLE
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('2. Top Indexed Repositories & Reach', 14, currentY);
  currentY += 3;

  const repoRows = (score.breakdown.impact.topStarredRepos || []).slice(0, 5).map(repo => [
    repo.name,
    repo.isPrivate ? 'Private Repository' : 'Public Repository',
    `★ ${repo.stars.toLocaleString()}`,
    repo.isFork ? 'Forked Repo' : 'Original Repository',
  ]);

  if (repoRows.length === 0) {
    repoRows.push(['All indexed repositories', 'Public', '0', 'Original']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Repository Name', 'Scope', 'Stars Count', 'Origin Status']],
    body: repoRows,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 36 },
      2: { fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 32 },
      3: { cellWidth: 44 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 6. ANTI-GAMING AUDIT FINDINGS
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('3. Anti-Gaming Verification & Code Integrity Audit', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Heuristic Anomaly Check', 'Audit Status', 'Score Penalty']],
    body: [
      ['Single-Day Commit Burst Check', score.antiGaming.commitSpamDetected ? 'ANOMALY FLAGGED' : 'PASSED (Organic Cadence)', score.antiGaming.commitSpamDetected ? '-15%' : '0%'],
      ['Fork Farming Check', score.antiGaming.forkSpamDetected ? 'ANOMALY FLAGGED' : 'PASSED (Original Contributions)', score.antiGaming.forkSpamDetected ? '-10%' : '0%'],
      ['Trivial PR Dump Check', score.antiGaming.prDumpDetected ? 'ANOMALY FLAGGED' : 'PASSED (Digestible Substantive PRs)', score.antiGaming.prDumpDetected ? '-15%' : '0%'],
      ['Overall Score Integrity', score.antiGaming.scoreDampeningApplied > 0 ? `Dampened by -${score.antiGaming.scoreDampeningApplied}%` : '100% VERIFIED ORGANIC', 'None'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 75 },
      1: { cellWidth: 75, fontStyle: 'bold' },
      2: { cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
  });

  // 7. FOOTER
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Report automatically compiled by DevRep Reputation Engine. Data derived directly from GitHub REST & GraphQL APIs.',
    14,
    286
  );
  doc.text(`Official verification URL: https://devrep.app/u/${score.username}`, 196, 286, { align: 'right' });

  // DIRECT DOWNLOAD TRIGGER
  doc.save(`devrep-${score.username}-reputation-report.pdf`);
}

/**
 * Generates an executive clean white PDF Developer Benchmark Comparison report.
 */
export function generateComparisonPDF(
  userA: ReputationScoreResult,
  userB: ReputationScoreResult
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const textDark: [number, number, number] = [15, 23, 42];
  const textMuted: [number, number, number] = [100, 116, 139];
  const borderGrey: [number, number, number] = [226, 232, 240];

  let currentY = 16;

  // Header accent line
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.5);
  doc.line(14, currentY, 196, currentY);

  currentY += 8;

  // Title
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('DEVREP — Head-to-Head Developer Benchmark Report', 14, currentY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Official Benchmark: https://devrep.app/compare', 196, currentY, { align: 'right' });

  currentY += 6;
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, 196, currentY);

  currentY += 10;

  // Side by side summary cards
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(14, currentY, 88, 28, 2, 2, 'FD');
  doc.roundedRect(108, currentY, 88, 28, 2, 2, 'FD');

  // Dev A
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text(`@${userA.username}`, 20, currentY + 8);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text(`Score: ${userA.overallScore}/100  •  ${userA.tier}`, 20, currentY + 15);
  doc.setTextColor(...textMuted);
  doc.text(`${userA.meta.publicRepoCount} Public Repos  •  ${userA.breakdown.impact.originalStars} Stars`, 20, currentY + 22);

  // Dev B
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`@${userB.username}`, 114, currentY + 8);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text(`Score: ${userB.overallScore}/100  •  ${userB.tier}`, 114, currentY + 15);
  doc.setTextColor(...textMuted);
  doc.text(`${userB.meta.publicRepoCount} Public Repos  •  ${userB.breakdown.impact.originalStars} Stars`, 114, currentY + 22);

  currentY += 36;

  // Benchmark Matrix Table
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Head-to-Head 5-Dimensional Benchmarks', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Benchmark Dimension', `@${userA.username}`, `@${userB.username}`, 'Advantage']],
    body: [
      ['Overall Reputation Score', `${userA.overallScore}/100 (${userA.tier})`, `${userB.overallScore}/100 (${userB.tier})`, userA.overallScore >= userB.overallScore ? `@${userA.username}` : `@${userB.username}`],
      ['Code Impact Score', `${userA.subScores.impact}/100 (${userA.breakdown.impact.originalStars}★)`, `${userB.subScores.impact}/100 (${userB.breakdown.impact.originalStars}★)`, userA.subScores.impact >= userB.subScores.impact ? `@${userA.username}` : `@${userB.username}`],
      ['Collaboration Score', `${userA.subScores.collaboration}/100 (${Math.round(userA.breakdown.collaboration.mergedRatio * 100)}% PRs)`, `${userB.subScores.collaboration}/100 (${Math.round(userB.breakdown.collaboration.mergedRatio * 100)}% PRs)`, userA.subScores.collaboration >= userB.subScores.collaboration ? `@${userA.username}` : `@${userB.username}`],
      ['Consistency Score', `${userA.subScores.consistency}/100 (${userA.breakdown.consistency.activeWeeksInLastYear} wks)`, `${userB.subScores.consistency}/100 (${userB.breakdown.consistency.activeWeeksInLastYear} wks)`, userA.subScores.consistency >= userB.subScores.consistency ? `@${userA.username}` : `@${userB.username}`],
      ['Breadth Score', `${userA.subScores.breadth}/100 (${userA.breakdown.breadth.primaryLanguages.length} langs)`, `${userB.subScores.breadth}/100 (${userB.breakdown.breadth.primaryLanguages.length} langs)`, userA.subScores.breadth >= userB.subScores.breadth ? `@${userA.username}` : `@${userB.username}`],
      ['Quality & Hygiene Score', `${userA.subScores.quality}/100 (+${userA.breakdown.quality.averagePRAdditions}/-${userA.breakdown.quality.averagePRDeletions})`, `${userB.subScores.quality}/100 (+${userB.breakdown.quality.averagePRAdditions}/-${userB.breakdown.quality.averagePRDeletions})`, userA.subScores.quality >= userB.subScores.quality ? `@${userA.username}` : `@${userB.username}`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Repositories comparison
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Key Indexed Repositories Comparison', 14, currentY);
  currentY += 3;

  const topA = userA.breakdown.impact.topStarredRepos?.[0]?.name || 'N/A';
  const topB = userB.breakdown.impact.topStarredRepos?.[0]?.name || 'N/A';

  autoTable(doc, {
    startY: currentY,
    head: [['Developer', 'Top Starred Repository', 'Original Stars', 'Forks', 'Public Repos']],
    body: [
      [`@${userA.username}`, topA, `★ ${userA.breakdown.impact.originalStars.toLocaleString()}`, `⑂ ${userA.breakdown.impact.originalForks.toLocaleString()}`, String(userA.meta.publicRepoCount)],
      [`@${userB.username}`, topB, `★ ${userB.breakdown.impact.originalStars.toLocaleString()}`, `⑂ ${userB.breakdown.impact.originalForks.toLocaleString()}`, String(userB.meta.publicRepoCount)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Official comparison URL: https://devrep.app/compare?u1=${userA.username}&u2=${userB.username}`, 14, 286);

  doc.save(`devrep-comparison-${userA.username}-vs-${userB.username}.pdf`);
}
