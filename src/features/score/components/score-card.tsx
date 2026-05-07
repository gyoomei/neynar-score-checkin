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
      ? "url(#gradient-elite)"
      : targetProgress >= 0.7
        ? "url(#gradient-veteran)"
        : targetProgress >= 0.5
          ? "url(#gradient-active)"
          : targetProgress >= 0.3
            ? "url(#gradient-casual)"
            : "url(#gradient-newcomer)";

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="gradient-elite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="gradient-veteran" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="gradient-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="gradient-casual" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="gradient-newcomer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ 
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))"
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-700 via-pink-600 to-orange-600">
          {formatScore(displayScore)}
        </span>
        <span className="text-xs font-semibold text-purple-500/70 mt-1">/ 1,00</span>
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="group flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3.5 border-2 border-white/60 bg-gradient-to-br from-white/90 via-purple-50/50 to-pink-50/40 shadow-[0_8px_24px_rgba(139,92,246,0.15)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(139,92,246,0.25)] hover:-translate-y-1 hover:scale-105 backdrop-blur-sm">
      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 transition-transform duration-300 group-hover:scale-110">{value}</span>
      <span className="text-xs text-purple-600/80 font-semibold">{label}</span>
    </div>
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
    <div className={`relative overflow-hidden bg-gradient-to-br from-white/95 via-purple-50/60 to-pink-50/40 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(139,92,246,0.25)] border-2 border-white/60 p-6 space-y-5 transition-all duration-500 hover:shadow-[0_25px_70px_rgba(139,92,246,0.35)] animate-[scale-in_0.5s_ease-out] ${isPreview ? "opacity-95" : ""}`}>
      <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-orange-400/25 to-yellow-400/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Profile */}
      <div className="relative flex items-center gap-3.5 group">
        {data.pfpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.pfpUrl}
            alt={data.displayName}
            width={56}
            height={56}
            className="rounded-full border-3 border-white shadow-xl object-cover w-14 h-14 transition-transform duration-300 group-hover:scale-110 ring-2 ring-purple-200/60"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110 ring-2 ring-purple-200/60">
            <span className="text-white font-bold text-xl">
              {(data.displayName ?? data.username)?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600 truncate text-lg">{data.displayName}</p>
          <p className="text-sm text-slate-600 font-medium">FID {data.fid}</p>
          <p className="text-sm text-purple-600 font-semibold">@{data.username}</p>
        </div>
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
