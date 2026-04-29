"use client";

import { useEffect, useRef, useState } from "react";
import { NeynarScoreData } from "@/features/score/types";

// Format score 0-1 as comma decimal e.g. "0,45"
function formatScore(score: number): string {
  return score.toFixed(2).replace(".", ",");
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const targetProgress = Math.min(Math.max(score, 0), 1);

  // Start at 0 (full offset = empty), animate to target on mount
  const [progress, setProgress] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Kick off on next frame so CSS transition fires
    const raf = requestAnimationFrame(() => {
      setProgress(targetProgress);
    });

    // Count-up animation for the number (~900ms, matches ring)
    const duration = 900;
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(eased * targetProgress);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayScore(targetProgress);
      }
    }
    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strokeDashoffset = circumference * (1 - progress);

  const color =
    score >= 0.9
      ? "#2563EB"
      : score >= 0.7
        ? "#3B82F6"
        : score >= 0.5
          ? "#60A5FA"
          : score >= 0.3
            ? "#93C5FD"
            : "#BFDBFE";

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg
        width="144"
        height="144"
        viewBox="0 0 144 144"
        className="-rotate-90"
      >
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="#DBEAFE"
          strokeWidth="10"
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-blue-700">
          {formatScore(displayScore)}
        </span>
        <span className="text-xs font-medium text-blue-400 mt-0.5">/ 1,00</span>
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-blue-50 rounded-xl px-4 py-2.5">
      <span className="text-base font-bold text-blue-700">{value}</span>
      <span className="text-xs text-blue-400">{label}</span>
    </div>
  );
}

function ScoreLevelBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    Elite: "bg-blue-600 text-white",
    Veteran: "bg-blue-500 text-white",
    Active: "bg-blue-400 text-white",
    Regular: "bg-blue-300 text-blue-900",
    Emerging: "bg-blue-200 text-blue-800",
    Newcomer: "bg-blue-100 text-blue-600",
  };
  const cls = colorMap[label] ?? "bg-blue-100 text-blue-600";
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

export function ScoreCard({ data }: { data: NeynarScoreData }) {
  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 space-y-4">
      {/* Profile */}
      <div className="flex items-center gap-3">
        {data.pfpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.pfpUrl}
            alt={data.displayName}
            width={48}
            height={48}
            className="rounded-full border-2 border-blue-100 object-cover w-12 h-12"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">
              {(data.displayName ?? data.username)?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{data.displayName}</p>
          <p className="text-sm text-blue-400">@{data.username}</p>
        </div>
        <ScoreLevelBadge label={data.scoreLabel} />
      </div>

      {/* Score Ring */}
      <div className="flex justify-center py-2">
        <ScoreRing score={data.score} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBadge label="Followers" value={formatNum(data.followerCount)} />
        <StatBadge label="Following" value={formatNum(data.followingCount)} />
        <StatBadge
          label="Wallets"
          value={data.verifiedAddresses.length.toString()}
        />
      </div>

      {/* Active status */}
      <div className="flex items-center gap-2 px-1">
        <span
          className={`inline-block w-2 h-2 rounded-full ${data.activeStatus === "active" ? "bg-green-400" : "bg-gray-300"}`}
        />
        <span className="text-xs text-gray-500">
          {data.activeStatus === "active" ? "Active on Farcaster" : "Inactive"}
        </span>
        <span className="ml-auto text-xs text-gray-400">FID #{data.fid}</span>
      </div>
    </div>
  );
}
