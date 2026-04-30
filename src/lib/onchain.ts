/**
 * Base Onchain Activity Scanner
 * Fetches transaction and contract interaction data from Base mainnet
 */

import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";

const BASE_RPC_URLS = [
  process.env.BASE_RPC_URL,
  process.env.VITE_BASE_RPC_URL,
  "https://mainnet.base.org",
  "https://base-rpc.publicnode.com",
  "https://base.llamarpc.com",
].filter(Boolean) as string[];

export interface OnchainMetrics {
  transactionCount: number;
  contractInteractions: number;
  lastActivityDays: number;
  hasActivity: boolean;
}

async function getPublicClient() {
  for (const rpcUrl of BASE_RPC_URLS) {
    try {
      const client = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      });
      // Test connection
      await client.getBlockNumber();
      return client;
    } catch {
      continue;
    }
  }
  throw new Error("All Base RPC endpoints failed");
}

export async function getOnchainMetrics(
  addresses: string[],
): Promise<OnchainMetrics> {
  if (addresses.length === 0) {
    return {
      transactionCount: 0,
      contractInteractions: 0,
      lastActivityDays: 999,
      hasActivity: false,
    };
  }

  try {
    const client = await getPublicClient();
    const currentBlock = await client.getBlockNumber();

    let totalTxCount = 0;
    let totalContractInteractions = 0;
    let mostRecentBlock = 0n;

    // Sample recent transactions for each address
    for (const addr of addresses.slice(0, 3)) {
      // Limit to 3 addresses
      try {
        const address = addr as Address;

        // Get transaction count (nonce)
        const txCount = await client.getTransactionCount({ address });
        totalTxCount += txCount;

        // Sample recent blocks to estimate contract interactions
        // Check last 1000 blocks (~30 minutes on Base)
        const fromBlock = currentBlock - 1000n;
        const toBlock = currentBlock;

        try {
          // Get logs for this address (indicates contract interactions)
          const logs = await client.getLogs({
            address: undefined,
            fromBlock,
            toBlock,
            args: undefined,
          });

          // Count logs where this address is involved
          const addressLower = address.toLowerCase();
          const relevantLogs = logs.filter(
            (log) =>
              log.address.toLowerCase() === addressLower ||
              log.topics.some((t) => t.toLowerCase().includes(addressLower.slice(2))),
          );

          totalContractInteractions += relevantLogs.length;

          // Track most recent activity
          if (relevantLogs.length > 0) {
            const recentLog = relevantLogs[relevantLogs.length - 1];
            if (recentLog.blockNumber > mostRecentBlock) {
              mostRecentBlock = recentLog.blockNumber;
            }
          }
        } catch {
          // Log fetching failed, skip
        }
      } catch {
        // Address processing failed, skip
      }
    }

    // Calculate days since last activity
    let lastActivityDays = 999;
    if (mostRecentBlock > 0n) {
      const blockDiff = Number(currentBlock - mostRecentBlock);
      // Base: ~2 seconds per block
      lastActivityDays = Math.floor((blockDiff * 2) / 86400);
    }

    return {
      transactionCount: totalTxCount,
      contractInteractions: totalContractInteractions,
      lastActivityDays,
      hasActivity: totalTxCount > 0 || totalContractInteractions > 0,
    };
  } catch {
    return {
      transactionCount: 0,
      contractInteractions: 0,
      lastActivityDays: 999,
      hasActivity: false,
    };
  }
}
