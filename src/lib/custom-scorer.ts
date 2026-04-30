/**
 * Custom Scoring Engine
 * Computes reputation score from Warpcast + Base onchain data
 * Score range: 0.00 - 1.00
 */

import type { WarpcastMetrics } from "./warpcast";
import type { OnchainMetrics } from "./onchain";

export interface ScoreBreakdown {
  social: number; // 0-0.4
  consistency: number; // 0-0.3
  trust: number; // 0-0.2
  onchain: number; // 0-0.1
  final: number; // 0-1.0
  label: string;
}

export const SCORE_LABELS = [
  { min: 0.0, max: 0.15, label: "Newcomer", color: "text-gray-400" },
  { min: 0.15, max: 0.3, label: "Emerging", color: "text-blue-400" },
  { min: 0.3, max: 0.5, label: "Regular", color: "text-emerald-400" },
  { min: 0.5, max: 0.7, label: "Active", color: "text-amber-400" },
  { min: 0.7, max: 0.9, label: "Veteran", color: "text-red-400" },
  { min: 0.9, max: 1.0, label: "Elite", color: "text-violet-400" },
] as const;

function getLabelForScore(score: number): string {
  const tier = SCORE_LABELS.find((t) => score >= t.min && score < t.max);
  return tier?.label || "Newcomer";
}

/**
 * Social Score (0-0.4)
 * Based on followers, engagement, and reach
 */
function computeSocialScore(metrics: WarpcastMetrics): number {
  const { followers, likesReceived, repliesReceived, recastsReceived, sampledCasts } = metrics;

  // Followers (log scale, max 0.15)
  const followerScore = Math.min(Math.log10(Math.max(followers, 1) + 10) / 20, 0.15);

  // Engagement per cast (max 0.15)
  const avgLikes = sampledCasts > 0 ? likesReceived / sampledCasts : 0;
  const avgReplies = sampledCasts > 0 ? repliesReceived / sampledCasts : 0;
  const avgRecasts = sampledCasts > 0 ? recastsReceived / sampledCasts : 0;

  const engagementScore = Math.min(
    (avgLikes * 0.01 + avgReplies * 0.02 + avgRecasts * 0.015) * 0.5,
    0.15,
  );

  // Total engagement (max 0.1)
  const totalEngagement = likesReceived + repliesReceived + recastsReceived;
  const totalEngagementScore = Math.min(Math.log10(Math.max(totalEngagement, 1) + 10) / 30, 0.1);

  return Math.min(followerScore + engagementScore + totalEngagementScore, 0.4);
}

/**
 * Consistency Score (0-0.3)
 * Based on activity frequency and tenure
 */
function computeConsistencyScore(metrics: WarpcastMetrics): number {
  const { activeDays30d, accountAgeDays, totalCasts } = metrics;

  // Active days in last 30 (max 0.15)
  const activityScore = Math.min(activeDays30d / 30, 1) * 0.15;

  // Account age (max 0.1)
  const ageScore = Math.min(Math.log10(Math.max(accountAgeDays, 1) + 1) / 10, 0.1);

  // Cast volume (max 0.05)
  const volumeScore = Math.min(Math.log10(Math.max(totalCasts, 1) + 10) / 30, 0.05);

  return Math.min(activityScore + ageScore + volumeScore, 0.3);
}

/**
 * Trust Score (0-0.2)
 * Based on verification, early adopter status, and account age
 */
function computeTrustScore(fid: number, metrics: WarpcastMetrics): number {
  const { verified, accountAgeDays } = metrics;

  // Verified status (0.08)
  const verifiedScore = verified ? 0.08 : 0;

  // Early adopter bonus (0.08)
  let earlyAdopterScore = 0;
  if (fid < 10_000) earlyAdopterScore = 0.08;
  else if (fid < 50_000) earlyAdopterScore = 0.04;
  else if (fid < 100_000) earlyAdopterScore = 0.02;

  // Account maturity (max 0.04)
  const maturityScore = Math.min(accountAgeDays / 365, 1) * 0.04;

  return Math.min(verifiedScore + earlyAdopterScore + maturityScore, 0.2);
}

/**
 * Onchain Score (0-0.1)
 * Based on Base network activity
 */
function computeOnchainScore(metrics: OnchainMetrics): number {
  const { transactionCount, contractInteractions, lastActivityDays } = metrics;

  // Transaction count (max 0.05)
  const txScore = Math.min(Math.log10(Math.max(transactionCount, 1) + 1) / 20, 0.05);

  // Contract interactions (max 0.03)
  const contractScore = Math.min(Math.log10(Math.max(contractInteractions, 1) + 1) / 20, 0.03);

  // Recency bonus (max 0.02)
  let recencyScore = 0;
  if (lastActivityDays < 7) recencyScore = 0.02;
  else if (lastActivityDays < 30) recencyScore = 0.01;

  return Math.min(txScore + contractScore + recencyScore, 0.1);
}

/**
 * Compute final score with breakdown
 */
export function computeCustomScore(
  fid: number,
  warpcast: WarpcastMetrics,
  onchain: OnchainMetrics,
): ScoreBreakdown {
  const social = computeSocialScore(warpcast);
  const consistency = computeConsistencyScore(warpcast);
  const trust = computeTrustScore(fid, warpcast);
  const onchainScore = computeOnchainScore(onchain);

  const final = Math.min(Math.max(social + consistency + trust + onchainScore, 0), 1);
  const label = getLabelForScore(final);

  return {
    social: Math.round(social * 1000) / 1000,
    consistency: Math.round(consistency * 1000) / 1000,
    trust: Math.round(trust * 1000) / 1000,
    onchain: Math.round(onchainScore * 1000) / 1000,
    final: Math.round(final * 1000) / 1000,
    label,
  };
}
