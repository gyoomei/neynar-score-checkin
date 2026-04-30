"use client";

import { useEffect, useRef, useState } from "react";
import { NeynarScoreData } from "@/features/score/types";

// Format score 0-1 as comma decimal e.g. "0,45"
function formatScore(score: number): string {
  return safeScore(score).toFixed(2).replace(".", ",");
}

function safeScore(score: number): number {
  return Number.isFinite(score) ? Math.min(Math.max(score, 0), 1) : 0;
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const targetProgress = safeScore(score);

  // Start at 0 (full offset = empty), animate to target on mount
  const [progress, setProgress] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Kick off on next frame so CSS transition fires on mount and updates
    const raf = requestAnimationFrame(() => {
      setProgress(targetProgress);
    });

    // Count-up / count-down animation for the number (~900ms, matches ring)
    const duration = 900;
    const start = performance.now();
    const startDisplayScore = displayScore;
    function step(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(
        startDisplayScore + (targetProgress - startDisplayScore) * eased,
      );
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayScore(targetProgress);
        setProgress(targetProgress);
      }
    }
    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // displayScore is intentionally omitted so the animation restarts only when
  // the incoming score changes, not on every animation frame.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetProgress]);

  const strokeDashoffset = circumference * (1 - progress);

  const color =
    targetProgress >= 0.9
      ? "#2563EB"
      : targetProgress >= 0.7
        ? "#3B82F6"
        : targetProgress >= 0.5
          ? "#60A5FA"
          : targetProgress >= 0.3
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
    <div className="group flex flex-col items-center gap-1 rounded-2xl px-4 py-3 border border-blue-200/70 bg-gradient-to-b from-white via-blue-50/50 to-blue-100/60 shadow-[0_8px_20px_rgba(37,99,235,0.12)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(37,99,235,0.18)] hover:-translate-y-0.5">
      <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-700 transition-transform duration-300 group-hover:scale-110">{value}</span>
      <span className="text-xs text-blue-600 font-medium">{label}</span>
    </div>
  );
}

function ScoreLevelBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    Elite: "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/50",
    Veteran: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-400/50",
    Active: "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-md shadow-blue-300/50",
    Regular: "bg-gradient-to-r from-blue-300 to-blue-400 text-blue-900 shadow-md shadow-blue-200/50",
    Emerging: "bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800 shadow-sm shadow-blue-100/50",
    Newcomer: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow-sm shadow-blue-50/50",
  };
  const cls = colorMap[label] ?? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow-sm";
  return (
    <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full ${cls} transition-all duration-300 hover:scale-105 animate-[fade-in_0.6s_ease-out]`}>
      {label}
    </span>
  );
}

export function ScoreCard({
  data,
  isPreview = false,
}: {
  data: NeynarScoreData;
  isPreview?: boolean;
}) {
  const formatNum = (n: number) => {
    const safe = safeCount(n);
    return safe >= 1000 ? `${(safe / 1000).toFixed(1)}K` : safe.toString();
  };
  const verifiedWalletCount = Array.isArray(data.verifiedAddresses)
    ? data.verifiedAddresses.length
    : 0;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(37,99,235,0.20)] border border-blue-200/70 p-6 space-y-4 transition-all duration-500 hover:shadow-[0_25px_70px_rgba(37,99,235,0.25)] animate-[scale-in_0.5s_ease-out] ${isPreview ? "opacity-95" : ""}`}>
      <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-400/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-violet-400/25 to-purple-400/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Profile */}
      <div className="relative flex items-center gap-3.5 group">
        {data.pfpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.pfpUrl}
            alt={data.displayName}
            width={56}
            height={56}
            className="rounded-full border-3 border-white shadow-lg object-cover w-14 h-14 transition-transform duration-300 group-hover:scale-105 ring-2 ring-blue-200/50"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 ring-2 ring-blue-200/50">
            <span className="text-white font-bold text-xl">
              {(data.displayName ?? data.username)?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate text-lg">{data.displayName}</p>
          <p className="text-sm text-slate-600 font-medium">FID {data.fid}</p>
          <p className="text-sm text-blue-600 font-semibold">@{data.username}</p>
        </div>
        <ScoreLevelBadge label={data.scoreLabel} />
      </div>

      {/* Score Ring */}
      <div className="relative flex justify-center py-2">
        <ScoreRing score={safeScore(data.score)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBadge label="Followers" value={formatNum(data.followerCount)} />
        <StatBadge label="Following" value={formatNum(data.followingCount)} />
        <StatBadge
          label="Wallets"
          value={verifiedWalletCount.toString()}
        />
      </div>

      {/* Active status + source */}
      <div className="flex items-center gap-2 px-1">
        <span
          className={`inline-block w-2 h-2 rounded-full ${data.activeStatus === "active" ? "bg-emerald-500" : "bg-slate-300"}`}
        />
        <span className="text-xs text-slate-600">
          {data.activeStatus === "active" ? "Active on Farcaster" : "Inactive"}
        </span>
        <span className="ml-auto text-xs text-slate-500">FID #{data.fid}</span>
      </div>

      <div className="px-1">
        <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200 shadow-sm">
          Source: {data.scoreSource === "neynar-api" ? "Neynar API" : "Onchain Base"}
        </span>
      </div>
    </div>
  );
}
