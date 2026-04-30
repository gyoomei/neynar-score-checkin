"use client";

import { useState, useEffect } from "react";
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";
import {
  useAccount,
  useChainId,
  useConnect,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { base } from "viem/chains";
import { NeynarWagmiProvider } from "@/neynar-web-sdk/blockchain";
import { CheckInStatus } from "@/features/score/types";

const GM_DATA = "0x676d" as const; // "gm" in hex
const GM_FALLBACK_TO = "0x000000000000000000000000000000000000dEaD" as const;

function getStorageKey(fid: number) {
  return `checkin_${fid}`;
}

function getCheckInStatus(fid: number): CheckInStatus {
  if (typeof window === "undefined") {
    return { canCheckIn: true, lastCheckIn: null, totalCheckIns: 0, streak: 0 };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(fid));
    if (!raw) {
      return { canCheckIn: true, lastCheckIn: null, totalCheckIns: 0, streak: 0 };
    }
    const parsed = JSON.parse(raw) as {
      lastCheckIn: string;
      totalCheckIns: number;
      streak: number;
    };
    const last = new Date(parsed.lastCheckIn);
    const diffHours = (Date.now() - last.getTime()) / (1000 * 60 * 60);
    return {
      canCheckIn: diffHours >= 24,
      lastCheckIn: parsed.lastCheckIn,
      totalCheckIns: parsed.totalCheckIns ?? 0,
      streak: parsed.streak ?? 0,
    };
  } catch {
    return { canCheckIn: true, lastCheckIn: null, totalCheckIns: 0, streak: 0 };
  }
}

function saveCheckIn(fid: number): CheckInStatus {
  const now = new Date();
  const existing = getCheckInStatus(fid);

  let streak = 1;
  if (existing.lastCheckIn) {
    const lastDate = new Date(existing.lastCheckIn);
    const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    // Continue streak if within 48h window, otherwise reset to 1
    streak = diffHours < 48 ? existing.streak + 1 : 1;
  }

  const next = {
    lastCheckIn: now.toISOString(),
    totalCheckIns: existing.totalCheckIns + 1,
    streak,
  };
  localStorage.setItem(getStorageKey(fid), JSON.stringify(next));
  return {
    canCheckIn: false,
    lastCheckIn: now.toISOString(),
    totalCheckIns: next.totalCheckIns,
    streak: next.streak,
  };
}

function formatTimeUntilNext(lastCheckIn: string): string {
  const last = new Date(lastCheckIn);
  const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
  const diff = next.getTime() - Date.now();
  if (diff <= 0) return "Now!";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m left`;
}

function CheckInInner() {
  const { data: user } = useFarcasterUser();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: base.id });
  const { connect, connectors } = useConnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [timeLabel, setTimeLabel] = useState("");
  const [justDone, setJustDone] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected || connectors.length === 0) return;
    const connector = connectors[0];
    connect({ connector }, { onError: () => undefined });
  }, [connect, connectors, isConnected]);

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
    reset,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Load status from localStorage
  useEffect(() => {
    if (!user?.fid) return;
    const s = getCheckInStatus(user.fid);
    setStatus(s);
  }, [user?.fid]);

  // Update countdown every 30s
  useEffect(() => {
    if (!status?.lastCheckIn || status.canCheckIn) return;
    const update = () => {
      if (status.lastCheckIn) {
        setTimeLabel(formatTimeUntilNext(status.lastCheckIn));
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [status]);

  // On confirmed — read fresh from storage to avoid stale counts
  useEffect(() => {
    if (!isConfirmed || !user?.fid) return;
    const updated = saveCheckIn(user.fid);
    setStatus(updated);
    setJustDone(true);
  }, [isConfirmed, user?.fid]);

  async function handleCheckIn() {
    reset();
    setJustDone(false);
    setLocalError(null);
    if (!address) return;
    try {
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }
      let toAddress = address;

      // Smart wallets/contract accounts can revert on self-call with data.
      // For contract accounts, use a neutral EOA target so zero-value GM tx stays valid.
      try {
        if (publicClient) {
          const code = await publicClient.getBytecode({ address });
          const isContractAccount = Boolean(code && code !== "0x");
          if (isContractAccount) {
            toAddress = GM_FALLBACK_TO;
          }
        }
      } catch {
        // If bytecode check fails, keep original behavior (send to self).
      }

      sendTransaction({
        to: toAddress,
        value: 0n,
        data: GM_DATA,
        chainId: base.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("reject") || message.toLowerCase().includes("denied")) {
        setLocalError("Network switch was rejected. Please switch to Base and try again.");
      } else {
        setLocalError("Could not switch to Base. Please open wallet network settings and choose Base.");
      }
    }
  }

  if (!user) {
    return (
      <div className="bg-blue-50 rounded-2xl p-6 text-center space-y-3">
        <div className="text-4xl">🔒</div>
        <p className="text-sm font-medium text-blue-700">
          Open in Farcaster to check in
        </p>
        <p className="text-xs text-blue-400">
          Check-in requires a Farcaster account
        </p>
      </div>
    );
  }

  const canCheckIn = status?.canCheckIn ?? true;
  const streak = status?.streak ?? 0;
  const totalCheckIns = status?.totalCheckIns ?? 0;

  return (
    <div className="space-y-4 animate-[fade-in_.25s_ease-out]">
      {/* Stats header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 rounded-3xl p-5 text-white shadow-[0_18px_40px_rgba(37,99,235,0.35)] border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">Daily Check-in</h2>
            <p className="text-blue-100 text-xs mt-0.5">
              GM onchain on Base, no fee except gas
            </p>
          </div>
          <div className="text-4xl">💙</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{streak}</p>
            <p className="text-xs text-blue-100 mt-0.5">🔥 Streak</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{totalCheckIns}</p>
            <p className="text-xs text-blue-100 mt-0.5">Total Check-ins</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white/75 backdrop-blur-sm border border-blue-100 rounded-2xl p-4 space-y-2 shadow-[0_10px_24px_rgba(37,99,235,0.08)]">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">💡</span>
          <span className="text-sm font-semibold text-blue-700">
            How Check-in Works
          </span>
        </div>
        <ul className="text-xs text-blue-600 space-y-1 pl-6 list-disc">
          <li>Sends a zero-value transaction to your own wallet</li>
          <li>Data payload is <strong>gm</strong> (0x676d)</li>
          <li>One check-in per 24 hours</li>
          <li>Transaction on Base network</li>
        </ul>
      </div>

      {/* Success */}
      {(isConfirmed || justDone) && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-700">
              Check-in successful!
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Streak: {streak} day{streak !== 1 ? "s" : ""} 🔥
            </p>
          </div>
        </div>
      )}

      {/* Tx hash */}
      {txHash && (
        <div className="bg-white/85 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <span className="text-xs text-gray-400">Tx:</span>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline truncate"
          >
            {txHash.slice(0, 18)}...{txHash.slice(-6)}
          </a>
        </div>
      )}

      {/* Error */}
      {localError && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
          {localError}
        </div>
      )}
      {sendError &&
        !sendError.message.includes("rejected") &&
        !sendError.message.includes("denied") && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
            Transaction failed. Make sure you have enough ETH on Base and try again.
          </div>
        )}

      {/* CTA */}
      {!canCheckIn && !justDone ? (
        <div className="w-full py-4 rounded-2xl border-2 border-blue-200 bg-white/70 backdrop-blur-sm text-center shadow-[0_8px_20px_rgba(37,99,235,0.08)]">
          <p className="text-sm font-semibold text-blue-600">
            Already checked in today ✓
          </p>
          <p className="text-xs text-blue-400 mt-1">Next: {timeLabel}</p>
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          disabled={!isConnected || isSwitchingChain || isSending || isConfirming || justDone}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base active:scale-95 transition-all disabled:opacity-60 shadow-[0_14px_30px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2"
        >
          {isSwitchingChain ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Switching to Base...
            </>
          ) : isSending ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Confirm in wallet...
            </>
          ) : isConfirming ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : justDone ? (
            "✅ Check-in Complete!"
          ) : !isConnected ? (
            "Wallet Not Connected"
          ) : (
            <>
              <span>🌤️</span>
              GM Onchain
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function CheckInTab() {
  return (
    <NeynarWagmiProvider>
      <CheckInInner />
    </NeynarWagmiProvider>
  );
}
