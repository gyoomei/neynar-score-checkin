"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Context } from "@farcaster/miniapp-sdk";
import { NeynarScoreData } from "@/features/score/types";
import { ScoreCard } from "@/features/score/components/score-card";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";

function formatScore(score: number): string {
  const safeScore = Number.isFinite(score) ? Math.min(Math.max(score, 0), 1) : 0;
  return safeScore.toFixed(2).replace(".", ",");
}

function readNumber(value: unknown, fallback = 0): number {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeScore(value: unknown): number {
  const n = readNumber(value, 0);
  if (n <= 1) return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
  return Math.max(0, Math.min(1, Math.round((n / 1_000_000) * 1000) / 1000));
}

function coerceScoreData(payload: unknown, requestedFid: number): NeynarScoreData {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid score response.");
  }
  const record = payload as Record<string, unknown>;
  const fid = Math.trunc(readNumber(record.fid, requestedFid));
  const username = String(record.username ?? `fid:${fid || requestedFid}`);
  const displayName = String(record.displayName ?? record.display_name ?? username);
  const score = normalizeScore(record.score);
  const verifiedAddresses = Array.isArray(record.verifiedAddresses)
    ? record.verifiedAddresses.filter((item): item is string => typeof item === "string")
    : [];

  return {
    fid: fid > 0 ? fid : requestedFid,
    username,
    displayName,
    pfpUrl: String(record.pfpUrl ?? record.pfp_url ?? ""),
    score,
    scoreLabel: String(record.scoreLabel ?? record.score_label ?? "Newcomer"),
    followerCount: Math.max(0, Math.trunc(readNumber(record.followerCount ?? record.follower_count, 0))),
    followingCount: Math.max(0, Math.trunc(readNumber(record.followingCount ?? record.following_count, 0))),
    verifiedAddresses,
    activeStatus: String(record.activeStatus ?? record.active_status ?? "inactive"),
    scoreSource: record.scoreSource === "neynar-api" ? "neynar-api" : "onchain-base",
  };
}

const previewScoreData: NeynarScoreData = {
  fid: 0,
  username: "your-fid",
  displayName: "Your Neynar Ring",
  pfpUrl: "",
  score: 0,
  scoreLabel: "Newcomer",
  followerCount: 0,
  followingCount: 0,
  verifiedAddresses: [],
  activeStatus: "preview",
  scoreSource: "onchain-base",
};

export function ScoreTab({
  farcasterUser,
}: {
  farcasterUser?: Context.UserContext | null;
}) {
  const [scoreData, setScoreData] = useState<NeynarScoreData | null>(null);
  const [fidInput, setFidInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const autoLoadedFidRef = useRef<number | null>(null);

  const fetchScore = useCallback(async (fid: number) => {
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`/api/score?fid=${fid}`, { cache: "no-store" });
      const payload = await res.json();

      if (!res.ok) {
        setScoreData(null);
        setError(payload?.error ?? `Score for FID ${fid} not found.`);
      } else {
        setScoreData(coerceScoreData(payload, fid));
      }
    } catch {
      setScoreData(null);
      setError("Unable to check score right now. Please try again.");
    } finally {
      setHasSearched(true);
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    const fid = farcasterUser?.fid;
    if (!fid || autoLoadedFidRef.current === fid) return;

    autoLoadedFidRef.current = fid;
    setFidInput(String(fid));
    void fetchScore(fid);
  }, [farcasterUser?.fid, fetchScore]);

  async function handleSearch() {
    const fid = Number.parseInt(fidInput.trim(), 10);
    if (!Number.isFinite(fid) || fid <= 0) {
      setError("Enter a valid Farcaster FID.");
      return;
    }

    await fetchScore(fid);
  }

  const displayedScoreData = scoreData ?? previewScoreData;

  return (
    <div className="space-y-4">
      {/* Score ring is visible immediately so the app does not open blank */}
      <ScoreCard data={displayedScoreData} isPreview={!scoreData} />

      {/* Search by FID */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={fidInput}
          onChange={(e) => setFidInput(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSearch();
            }
          }}
          placeholder="Enter Farcaster FID"
          className="flex-1 px-4 py-3 rounded-xl border border-blue-200 bg-white text-sm text-gray-800 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isPending}
          className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm active:scale-95 transition-all disabled:opacity-50"
        >
          {isPending ? "Checking…" : "Check"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isPending && !scoreData && (
        <div className="bg-white/70 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-500 text-center">
          Loading your Neynar ring…
        </div>
      )}

      {/* Hint / empty state */}
      {!hasSearched && !scoreData && !isPending && (
        <div className="bg-white/70 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-400 text-center">
          {farcasterUser?.fid
            ? "Opening your Farcaster score automatically…"
            : "Enter a Farcaster FID to fill the ring with a live Neynar score."}
        </div>
      )}

      {/* Share */}
      {scoreData && (
        <ShareButton
          text={`FID ${scoreData.fid} Neynar Score is ${formatScore(scoreData.score)} (${scoreData.scoreLabel})! Check your Farcaster score 👇`}
          queryParams={{
            score: formatScore(scoreData.score),
            username: scoreData.username,
          }}
          className="w-full py-3 rounded-2xl border-2 border-blue-200 text-blue-600 font-semibold text-sm bg-white active:scale-95 transition-all"
        >
          Share My Score
        </ShareButton>
      )}
    </div>
  );
}
