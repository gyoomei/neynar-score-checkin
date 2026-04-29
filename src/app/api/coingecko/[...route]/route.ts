import { NextResponse } from "next/server";
import { Coingecko } from "@coingecko/coingecko-typescript";
import { createCoinGeckoApiHandler } from "@/neynar-web-sdk/nextjs";
import { privateConfig } from "@/config/private-config";

function missingApiKeyResponse() {
  return NextResponse.json(
    { error: "COINGECKO_API_KEY is not configured" },
    { status: 503 },
  );
}

const client = privateConfig.coingeckoApiKey
  ? new Coingecko({
      demoAPIKey: privateConfig.coingeckoApiKey,
      environment: "demo",
    })
  : null;

const handlers = client ? createCoinGeckoApiHandler(client) : null;

export const GET = handlers?.GET ?? missingApiKeyResponse;
export const POST = handlers?.POST ?? missingApiKeyResponse;
export const PUT = handlers?.PUT ?? missingApiKeyResponse;
export const DELETE = handlers?.DELETE ?? missingApiKeyResponse;
export const OPTIONS = handlers?.OPTIONS ?? missingApiKeyResponse;
