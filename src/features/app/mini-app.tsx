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
    <div className="flex gap-1 bg-blue-50 rounded-2xl p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            active === t.id
              ? "bg-white text-blue-600 shadow-sm"
              : "text-blue-400 hover:text-blue-600"
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
      className="min-h-dvh flex flex-col"
      style={{ background: "#EFF6FF" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-blue-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
          N
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900 leading-tight">
            Neynar Score
          </h1>
          <p className="text-xs text-blue-400">Your Farcaster reputation</p>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === "score" ? <ScoreTab farcasterUser={user} /> : <CheckInTab />}
      </div>
    </div>
  );
}
