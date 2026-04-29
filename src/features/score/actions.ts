"use server";

import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { NeynarScoreData } from "@/features/score/types";

const SCORE_CONTRACT = "0xd3C43A38D1D3E47E9c420a733e439B03FAAdebA8" as const;
const SCORE_RPC_URLS = [
  process.env.BASE_RPC_URL,
  process.env.VITE_BASE_RPC_URL,
  "https://mainnet.base.org",
  "https://base-rpc.publicnode.com",
  "https://base.llamarpc.com",
].filter(Boolean) as string[];

const scoreAbi = [
  {
    name: "getScore",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "fid", type: "uint256" }],
    outputs: [{ name: "score", type: "uint24" }],
  },
] as const;

function labelForScore(score: number): string {
  if (score >= 0.9) return "Elite";
  if (score >= 0.7) return "Veteran";
  if (score >= 0.5) return "Active";
  if (score >= 0.3) return "Regular";
  if (score >= 0.1) return "Emerging";
  return "Newcomer";
}

function normalizeScore(raw: bigint | number | string | null | undefined): number {
  const value = Number(raw ?? 0);
  if (!Number.isFinite(value)) return 0;

  // Neynar API returns 0..1 decimals, while the Base score contract returns
  // 0..1_000_000 integers. Normalize both shapes into the UI's 0..1 range.
  if (value <= 1) {
    return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
  }

  return Math.max(
    0,
    Math.min(1, Math.round((value / 1_000_000) * 1000) / 1000),
  );
}

function pickNeynarScore(user: Record<string, unknown>): number {
  const experimental = user.experimental as Record<string, unknown> | undefined;
  return normalizeScore(
    (experimental?.neynar_user_score ??
      experimental?.neynarUserScore ??
      user.neynar_user_score ??
      user.neynarUserScore ??
      user.score) as bigint | number | string | null | undefined,
  );
}

async function fetchOnchainScore(fid: number): Promise<NeynarScoreData | null> {
  for (const rpcUrl of SCORE_RPC_URLS) {
    try {
      const client = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      });
      const raw = await client.readContract({
        address: SCORE_CONTRACT,
        abi: scoreAbi,
        functionName: "getScore",
        args: [BigInt(fid)],
      });
      const score = normalizeScore(raw);
      return {
        fid,
        username: `fid:${fid}`,
        displayName: `FID ${fid}`,
        pfpUrl: "",
        score,
        scoreLabel: labelForScore(score),
        followerCount: 0,
        followingCount: 0,
        verifiedAddresses: [],
        activeStatus: "onchain-base",
      };
    } catch {
      // Try the next public Base RPC fallback.
    }
  }
  return null;
}

export async function fetchNeynarScore(
  fid: number,
): Promise<NeynarScoreData | null> {
  if (!Number.isInteger(fid) || fid <= 0) return null;

  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) throw new Error("Missing NEYNAR_API_KEY");

    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          "x-api-key": apiKey,
          accept: "application/json",
        },
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) throw new Error("Failed to fetch user");

    const data = await res.json();
    const user = data.users?.[0];
    if (!user) return fetchOnchainScore(fid);

    const userRecord = user as Record<string, unknown>;
    const verifiedAddresses = userRecord.verified_addresses as
      | { eth_addresses?: string[] }
      | undefined;
    const score = pickNeynarScore(userRecord);

    return {
      fid: Number(userRecord.fid) || fid,
      username: String(userRecord.username ?? `fid:${fid}`),
      displayName: String(
        userRecord.display_name ??
          userRecord.displayName ??
          userRecord.username ??
          `FID ${fid}`,
      ),
      pfpUrl: String(userRecord.pfp_url ?? userRecord.pfpUrl ?? ""),
      score,
      scoreLabel: labelForScore(score),
      followerCount: Number(userRecord.follower_count ?? userRecord.followerCount ?? 0),
      followingCount: Number(userRecord.following_count ?? userRecord.followingCount ?? 0),
      verifiedAddresses: verifiedAddresses?.eth_addresses ?? [],
      activeStatus: String(userRecord.active_status ?? userRecord.activeStatus ?? "active"),
    };
  } catch {
    return fetchOnchainScore(fid);
  }
}
