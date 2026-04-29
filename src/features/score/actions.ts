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

function normalizeScore(raw: bigint | number): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.max(
    0,
    Math.min(1, Math.round((value / 1_000_000) * 1000) / 1000),
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

    const rawScore: number = user.experimental?.neynar_user_score ?? 0;
    const score = Math.max(0, Math.min(1, Math.round(rawScore * 1000) / 1000));

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name ?? user.username,
      pfpUrl: user.pfp_url ?? "",
      score,
      scoreLabel: labelForScore(score),
      followerCount: user.follower_count ?? 0,
      followingCount: user.following_count ?? 0,
      verifiedAddresses: user.verified_addresses?.eth_addresses ?? [],
      activeStatus: user.active_status ?? "active",
    };
  } catch {
    return fetchOnchainScore(fid);
  }
}
