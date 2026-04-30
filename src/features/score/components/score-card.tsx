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
    <div className="flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2.5 border border-blue-100 bg-gradient-to-b from-white to-blue-50/70 shadow-[0_6px_16px_rgba(37,99,235,0.08)]">
      <span className="text-base font-bold text-blue-700">{value}</span>
      <span className="text-xs text-blue-500">{label}</span>
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
    <div className={`relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_16px_48px_rgba(37,99,235,0.14)] border border-blue-100/90 p-5 space-y-4 ${isPreview ? "opacity-95" : ""}`}>
      <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 w-52 h-52 rounded-full bg-indigo-200/25 blur-3xl" />

      {/* Profile */}
      <div className="relative flex items-center gap-3">
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
