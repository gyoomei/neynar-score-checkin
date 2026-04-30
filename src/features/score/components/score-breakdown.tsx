"use client";

import { useEffect, useState } from "react";
import { NeynarScoreData } from "@/features/score/types";

interface ScoreBreakdownProps {
  data: NeynarScoreData;
}

export function ScoreBreakdown({ data }: ScoreBreakdownProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data.breakdown) return null;

  const bars = [
    {
      label: "Social",
      value: data.breakdown.social,
      max: 0.4,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      icon: "🌐",
      delay: "delay-[100ms]",
    },
    {
      label: "Consistency",
      value: data.breakdown.consistency,
      max: 0.3,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      icon: "⚡",
      delay: "delay-[200ms]",
    },
    {
      label: "Trust",
      value: data.breakdown.trust,
      max: 0.2,
      gradient: "from-amber-500 to-amber-600",
      bgGradient: "from-amber-50 to-amber-100",
      icon: "🛡️",
      delay: "delay-[300ms]",
    },
    {
      label: "Onchain",
      value: data.breakdown.onchain,
      max: 0.1,
      gradient: "from-violet-500 to-violet-600",
      bgGradient: "from-violet-50 to-violet-100",
      icon: "⛓️",
      delay: "delay-[400ms]",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 backdrop-blur-md border border-blue-200/60 rounded-3xl p-5 space-y-4 shadow-[0_20px_50px_rgba(37,99,235,0.15)] animate-[slide-up_0.6s_ease-out]">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-400/20 blur-2xl" />

      <div className="relative flex items-center gap-2.5 mb-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
          <span className="text-white text-base">📊</span>
        </div>
        <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
          Score Breakdown
        </span>
      </div>

      <div className="relative space-y-3.5">
        {bars.map((bar, index) => {
          const percentage = Math.min((bar.value / bar.max) * 100, 100);
          const displayValue = (bar.value * 100).toFixed(0);

          return (
            <div
              key={bar.label}
              className={`space-y-2 transition-all duration-500 ${bar.delay} ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{bar.icon}</span>
                  <span className="text-slate-800 font-semibold">{bar.label}</span>
                </div>
                <span className="text-slate-700 font-bold tabular-nums">
                  {displayValue}<span className="text-slate-500 font-normal">/{(bar.max * 100).toFixed(0)}</span>
                </span>
              </div>
              <div className={`relative h-3 bg-gradient-to-r ${bar.bgGradient} rounded-full overflow-hidden shadow-inner`}>
                <div
                  className={`h-full bg-gradient-to-r ${bar.gradient} rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden`}
                  style={{
                    width: isVisible ? `${percentage}%` : "0%",
                  }}
                >
                  {/* Shimmer effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{
                      animation: "shimmer 2s infinite",
                      backgroundSize: "200% 100%",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative pt-3 mt-1 border-t border-blue-200/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Data Source</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {data.scoreSource === "custom-warpcast"
              ? "Warpcast + Base"
              : data.scoreSource === "neynar-api"
                ? "Neynar API"
                : "Base Contract"}
          </span>
        </div>
      </div>
    </div>
  );
}
