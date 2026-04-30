"use client";

import { useState } from "react";
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";
import { ScoreTab } from "@/features/score/components/score-tab";
import { CheckInTab } from "@/features/score/components/checkin-tab";
import { Tab } from "@/features/score/types";

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "score", label: "Neynar Score", icon: "⭐" },
    { id: "checkin", label: "Check-in", icon: "📅" },
  ];
  return (
    <div className="flex gap-1.5 bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 border border-blue-100/80 shadow-[0_10px_28px_rgba(37,99,235,0.10)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            active === t.id
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_18px_rgba(37,99,235,0.32)]"
              : "text-blue-500/90 hover:text-blue-700 hover:bg-white/80"
          }`}
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function MiniApp() {
  const [activeTab, setActiveTab] = useState<Tab>("score");
  const { data: user, isLoading } = useFarcasterUser();

  return (
    <div
      className="min-h-dvh flex flex-col bg-[radial-gradient(120%_60%_at_50%_-10%,#bfdbfe_0%,#dbeafe_30%,#eff6ff_60%,#f8fbff_100%)]"
    >
      {/* Header */}
      <div className="backdrop-blur-md bg-white/80 border-b border-blue-100/80 px-4 py-3.5 flex items-center gap-3 sticky top-0 z-10 shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-[0_8px_24px_rgba(37,99,235,0.35)] ring-2 ring-white">
          N
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">
            Neynar Score
          </h1>
          <p className="text-xs text-blue-500/90">Your Farcaster reputation</p>
        </div>
        {!isLoading && user && (
          <div className="flex items-center gap-2">
            {user.pfpUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.pfpUrl}
                alt={user.displayName}
                className="w-7 h-7 rounded-full border border-blue-100 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {user.displayName?.[0] ?? "?"}
              </div>
            )}
            <span className="text-xs text-gray-600 font-medium">
              @{user.username}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8">
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === "score" ? <ScoreTab farcasterUser={user} /> : <CheckInTab />}
      </div>
    </div>
  );
}
