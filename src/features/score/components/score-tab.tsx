"use client";

import { useState } from "react";
import { NeynarScoreData } from "@/features/score/types";
import { ScoreCard } from "@/features/score/components/score-card";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";

function formatScore(score: number): string {
  return score.toFixed(2).replace(".", ",");
}

export function ScoreTab() {
  const [scoreData, setScoreData] = useState<NeynarScoreData | null>(null);
  const [fidInput, setFidInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSearch() {
    const fid = Number.parseInt(fidInput.trim(), 10);
    if (!Number.isFinite(fid) || fid <= 0) {
      setError("Enter a valid Farcaster FID.");
      return;
    }

    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`/api/score?fid=${fid}`);
      const payload = await res.json();

      if (!res.ok) {
        setScoreData(null);
        setError(payload?.error ?? `Score for FID ${fid} not found.`);
      } else {
        setScoreData(payload as NeynarScoreData);
      }
    } catch {
      setScoreData(null);
      setError("Unable to check score right now. Please try again.");
    } finally {
      setHasSearched(true);
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search by FID */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={fidInput}
          onChange={(e) => setFidInput(e.target.value.replace(/\D/g, ""))}
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

      {/* Loading skeleton */}
      {isPending && !scoreData && (
        <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-blue-100 rounded w-32" />
              <div className="h-3 bg-blue-50 rounded w-20" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-36 h-36 rounded-full bg-blue-50" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 bg-blue-50 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Score card */}
      {scoreData && (
        <>
          <ScoreCard data={scoreData} />
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
        </>
      )}

      {/* Empty state */}
      {!hasSearched && !scoreData && !isPending && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
            🔍
          </div>
          <p className="text-sm text-blue-400 text-center">
            Enter a Farcaster FID to check its Neynar score
          </p>
        </div>
      )}
    </div>
  );
}
