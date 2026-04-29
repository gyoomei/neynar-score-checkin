// Complete Neynar API proxy using our new architecture
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { createNeynarApiHandler } from "@/neynar-web-sdk/nextjs";
import { privateConfig } from "@/config/private-config";

function missingApiKeyResponse() {
  return Response.json(
    { error: "NEYNAR_API_KEY is not configured" },
    { status: 503 },
  );
}

let handlers: ReturnType<typeof createNeynarApiHandler> | null = null;

if (privateConfig.neynarApiKey) {
  // Create SDK client with proper Configuration object (SDK requires this format to pass API key)
  const config = new Configuration({
    apiKey: privateConfig.neynarApiKey,
  });

  const client = new NeynarAPIClient(config);
  handlers = createNeynarApiHandler(client);
}

export const GET = handlers?.GET ?? missingApiKeyResponse;
export const POST = handlers?.POST ?? missingApiKeyResponse;
export const PUT = handlers?.PUT ?? missingApiKeyResponse;
export const DELETE = handlers?.DELETE ?? missingApiKeyResponse;
export const OPTIONS = handlers?.OPTIONS ?? missingApiKeyResponse;
