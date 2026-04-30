/**
 * Warpcast Public API Client (No API Key Required)
 * Free tier with rate limits - suitable for MVP scoring
 */

const WARPCAST_API = "https://api.warpcast.com/v2";

interface WarpcastUser {
  fid: number;
  username: string;
  displayName?: string;
  pfp?: { url?: string };
  followerCount: number;
  followingCount: number;
  profile?: {
    bio?: { text?: string };
  };
  verifications?: string[];
  activeOnFcNetwork?: boolean;
}

interface WarpcastCast {
  hash: string;
  author: { fid: number };
  text: string;
  timestamp: number;
  reactions: {
    count: number;
  };
  replies?: {
    count: number;
  };
  recasts?: {
    count: number;
  };
  mentions?: number[];
}

interface WarpcastUserResponse {
  result: {
    user: WarpcastUser;
  };
}

interface WarpcastCastsResponse {
  result: {
    casts: WarpcastCast[];
  };
  next?: {
    cursor?: string;
  };
}

async function fetchWarpcast<T>(path: string): Promise<T> {
  const res = await fetch(`${WARPCAST_API}${path}`, {
    headers: {
      accept: "application/json",
      "user-agent": "neynar-score-checkin/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Warpcast API error: ${res.status}`);
  }

  return res.json();
}

export async function getWarpcastUser(fid: number): Promise<WarpcastUser | null> {
  try {
    const data = await fetchWarpcast<WarpcastUserResponse>(`/user-by-fid?fid=${fid}`);
    return data.result?.user || null;
  } catch {
    return null;
  }
}

export async function getWarpcastCasts(
  fid: number,
  options: { limit?: number; maxPages?: number } = {},
): Promise<WarpcastCast[]> {
  const limit = options.limit ?? 100;
  const maxPages = options.maxPages ?? 3;
  const casts: WarpcastCast[] = [];
  let cursor: string | undefined;

  try {
    for (let page = 0; page < maxPages; page++) {
      const path = `/casts?fid=${fid}&limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
      const data = await fetchWarpcast<WarpcastCastsResponse>(path);

      const pageCasts = data.result?.casts || [];
      casts.push(...pageCasts);

      if (!data.next?.cursor || pageCasts.length === 0) break;
      cursor = data.next.cursor;
    }
  } catch {
    // Return partial results on error
  }

  return casts;
}

export interface WarpcastMetrics {
  followers: number;
  following: number;
  totalCasts: number;
  likesReceived: number;
  repliesReceived: number;
  recastsReceived: number;
  activeDays30d: number;
  accountAgeDays: number;
  verified: boolean;
  sampledCasts: number;
}

export async function getWarpcastMetrics(fid: number): Promise<WarpcastMetrics | null> {
  const user = await getWarpcastUser(fid);
  if (!user) return null;

  const casts = await getWarpcastCasts(fid, { limit: 100, maxPages: 3 });

  // Calculate metrics from sampled casts
  const likesReceived = casts.reduce((sum, c) => sum + (c.reactions?.count || 0), 0);
  const repliesReceived = casts.reduce((sum, c) => sum + (c.replies?.count || 0), 0);
  const recastsReceived = casts.reduce((sum, c) => sum + (c.recasts?.count || 0), 0);

  // Calculate active days in last 30 days
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentCasts = casts.filter((c) => c.timestamp * 1000 >= thirtyDaysAgo);
  const uniqueDays = new Set(
    recentCasts.map((c) => new Date(c.timestamp * 1000).toISOString().split("T")[0]),
  ).size;

  // Estimate account age from oldest sampled cast
  const oldestCast = casts.length > 0 ? Math.min(...casts.map((c) => c.timestamp)) : now / 1000;
  const accountAgeDays = Math.floor((now / 1000 - oldestCast) / 86400);

  return {
    followers: user.followerCount || 0,
    following: user.followingCount || 0,
    totalCasts: casts.length,
    likesReceived,
    repliesReceived,
    recastsReceived,
    activeDays30d: uniqueDays,
    accountAgeDays: Math.max(accountAgeDays, 1),
    verified: (user.verifications?.length || 0) > 0,
    sampledCasts: casts.length,
  };
}
