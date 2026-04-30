"use client";

import { NeynarScoreData } from "@/features/score/types";

interface ScoreBreakdownProps {
  data: NeynarScoreData;
}

export function ScoreBreakdown({ data }: ScoreBreakdownProps) {
  if (!data.breakdown) return null;

  const bars = [
    {
      label: "Social",
      value: data.breakdown.social,
      max: 0.4,
      color: "bg-blue-500",
      icon: "🌐",
    },
    {
      label: "Consistency",
      value: data.breakdown.consistency,
      max: 0.3,
      color: "bg-emerald-500",
      icon: "⚡",
    },
    {
      label: "Trust",
      value: data.breakdown.trust,
      max: 0.2,
      color: "bg-amber-500",
      icon: "🛡️",
    },
    {
      label: "Onchain",
      value: data.breakdown.onchain,
      max: 0.1,
      color: "bg-violet-500",
      icon: "⛓️",
    },
  ];

  return (
    <div className="bg-white/75 backdrop-blur-sm border border-blue-100 rounded-2xl p-4 space-y-3 shadow-[0_10px_24px_rgba(37,99,235,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-500 text-lg">📊</span>
        <span className="text-sm font-semibold text-blue-700">Score Breakdown</span>
      </div>

      {bars.map((bar) => {
        const percentage = Math.min((bar.value / bar.max) * 100, 100);
        const displayValue = (bar.value * 100).toFixed(0);

        return (
          <div key={bar.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span>{bar.icon}</span>
                <span className="text-slate-700 font-medium">{bar.label}</span>
              </div>
              <span className="text-slate-600 font-semibold">
                {displayValue}/{(bar.max * 100).toFixed(0)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${bar.color} transition-all duration-700 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="pt-2 mt-2 border-t border-blue-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Data Source</span>
          <span className="text-blue-600 font-medium">
            {data.scoreSource === "custom-warpcast"
              ? "Warpcast + Base Onchain"
              : data.scoreSource === "neynar-api"
                ? "Neynar API"
                : "Base Contract"}
          </span>
        </div>
      </div>
    </div>
  );
}
