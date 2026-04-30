"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Context } from "@farcaster/miniapp-sdk";
import { NeynarScoreData } from "@/features/score/types";
import { ScoreCard } from "@/features/score/components/score-card";
import { ScoreBreakdown } from "@/features/score/components/score-breakdown";
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
        const normalized = coerceScoreData(payload, fid);
        const fallbackUsername = farcasterUser?.username?.trim();
        const fallbackDisplayName = farcasterUser?.displayName?.trim();
        const shouldUseFarcasterIdentity =
          farcasterUser?.fid === fid &&
          (normalized.username.startsWith("fid:") || normalized.username === String(fid));

        if (shouldUseFarcasterIdentity) {
          setScoreData({
            ...normalized,
            username: fallbackUsername || normalized.username,
            displayName: fallbackDisplayName || normalized.displayName,
            pfpUrl: farcasterUser?.pfpUrl || normalized.pfpUrl,
          });
        } else {
          setScoreData(normalized);
        }
      }
    } catch {
      setScoreData(null);
      setError("Unable to check score right now. Please try again.");
    } finally {
      setHasSearched(true);
      setIsPending(false);
    }
  }, [farcasterUser?.displayName, farcasterUser?.fid, farcasterUser?.pfpUrl, farcasterUser?.username]);

  useEffect(() => {
    const fid = farcasterUser?.fid;
    if (!fid || autoLoadedFidRef.current === fid) return;

    autoLoadedFidRef.current = fid;
    setFidInput(String(fid));

    // Show Farcaster identity instantly while score is loading
    setScoreData((prev) => ({
      fid,
      username: farcasterUser?.username?.trim() || prev?.username || `fid:${fid}`,
      displayName:
        farcasterUser?.displayName?.trim() || prev?.displayName || farcasterUser?.username?.trim() || `FID ${fid}`,
      pfpUrl: farcasterUser?.pfpUrl || prev?.pfpUrl || "",
      score: prev?.score ?? 0,
      scoreLabel: prev?.scoreLabel ?? "Newcomer",
      followerCount: prev?.followerCount ?? 0,
      followingCount: prev?.followingCount ?? 0,
      verifiedAddresses: prev?.verifiedAddresses ?? [],
      activeStatus: prev?.activeStatus ?? "loading",
      scoreSource: prev?.scoreSource ?? "onchain-base",
    }));

    void fetchScore(fid);
  }, [
    farcasterUser?.displayName,
    farcasterUser?.fid,
    farcasterUser?.pfpUrl,
    farcasterUser?.username,
    fetchScore,
  ]);

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
    <div className="space-y-4 animate-[fade-in_.25s_ease-out]">
      {/* Score ring is visible immediately so the app does not open blank */}
      <ScoreCard data={displayedScoreData} isPreview={!scoreData} />

      {/* Breakdown (only show for real data with breakdown) */}
      {scoreData && scoreData.breakdown && <ScoreBreakdown data={scoreData} />}

      {/* Search by FID */}
      <div className="flex gap-2 rounded-2xl p-1.5 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/40 backdrop-blur-md border border-blue-200/70 shadow-[0_12px_32px_rgba(37,99,235,0.12)] animate-[fade-in_0.4s_ease-out_0.2s_backwards]">
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
          className="flex-1 px-4 py-3.5 rounded-xl border border-blue-200/80 bg-white/90 text-sm text-slate-800 placeholder-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 focus:shadow-lg"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isPending}
          className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-bold text-sm active:scale-95 transition-all duration-300 disabled:opacity-50 shadow-[0_12px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_16px_32px_rgba(37,99,235,0.45)] disabled:shadow-none relative overflow-hidden group"
        >
          <span className="relative z-10">{isPending ? "Checking…" : "Check"}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/80 rounded-2xl px-4 py-3.5 text-sm text-red-700 font-medium shadow-lg shadow-red-100/50 animate-[slide-up_0.3s_ease-out]">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isPending && !scoreData && (
        <div className="bg-gradient-to-r from-white to-blue-50/70 border border-blue-200/70 rounded-2xl px-4 py-3.5 text-sm text-blue-600 text-center font-medium shadow-lg animate-pulse">
          Loading your Neynar ring…
        </div>
      )}

      {/* Hint / empty state */}
      {!hasSearched && !scoreData && !isPending && (
        <div className="bg-gradient-to-r from-white to-blue-50/50 border border-blue-200/60 rounded-2xl px-4 py-3.5 text-sm text-blue-500 text-center font-medium shadow-md animate-[fade-in_0.5s_ease-out_0.3s_backwards]">
          {farcasterUser?.fid
            ? "Opening your Farcaster score automatically…"
            : "Enter a Farcaster FID to fill the ring with a live Neynar score."}
        </div>
      )}

      {/* Share */}
      {scoreData && (
        <ShareButton
          text={`Neynar Score aku ${formatScore(scoreData.score)} (${scoreData.scoreLabel}). Cek skor Farcaster kamu juga 👇`}
          queryParams={{
            score: formatScore(scoreData.score),
            username: scoreData.username,
          }}
          className="w-full py-3.5 rounded-2xl border-2 border-blue-300/80 text-blue-700 font-bold text-sm bg-gradient-to-r from-white to-blue-50/60 active:scale-95 transition-all duration-300 shadow-[0_8px_20px_rgba(37,99,235,0.15)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:border-blue-400 animate-[fade-in_0.5s_ease-out_0.4s_backwards]"
        >
          Share My Score
        </ShareButton>
      )}
    </div>
  );
}
