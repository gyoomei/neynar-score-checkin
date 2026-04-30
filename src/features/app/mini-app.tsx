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
  const tabs: { id: Tab; label: string; icon?: string }[] = [
    { id: "score", label: "Neynar Score", icon: "⭐" },
    { id: "checkin", label: "Check-in", icon: "✨" },
  ];
  return (
    <div className="flex gap-2 bg-white/80 backdrop-blur-xl rounded-3xl p-1.5 border border-white/60 shadow-[0_10px_40px_rgba(139,92,246,0.15)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${\n            active === t.id
              ? "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-[0_8px_24px_rgba(139,92,246,0.4)] scale-105"
              : "text-purple-600/70 hover:text-purple-700 hover:bg-white/60 hover:scale-102"\n          }`}
        >
          {t.icon ? <span className="text-base">{t.icon}</span> : null}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function MiniApp() {
  const [activeTab, setActiveTab] = useState<Tab>("score");
  const { data: user } = useFarcasterUser();

  return (
    <div
      className="min-h-dvh flex flex-col bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 relative overflow-hidden"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-400/30 to-yellow-400/30 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />
      </div>

      {/* Header */}
      <div className="relative backdrop-blur-xl bg-white/70 border-b border-white/50 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-[0_8px_24px_rgba(139,92,246,0.4)] ring-2 ring-white/50 animate-[pulse_3s_ease-in-out_infinite]">
          ⭐
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-orange-600 leading-tight tracking-tight">
            Neynar Score
          </h1>
          <p className="text-xs text-purple-600/80 font-medium">Your Farcaster reputation ✨</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/50 shadow-lg">
            {user.pfpUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.pfpUrl}
                alt={user.displayName}
                className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-md"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {user.displayName?.[0] ?? "?"}
              </div>
            )}
            <span className="text-xs text-slate-700 font-semibold">
              @{user.username}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-8">
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === "score" ? <ScoreTab farcasterUser={user} /> : <CheckInTab />}
      </div>
    </div>
  );
}
