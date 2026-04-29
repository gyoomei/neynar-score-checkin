import "server-only";
import { z } from "zod";

const privateConfigSchema = z.object({
  neynarApiKey: z.string().optional().default(""),
  coingeckoApiKey: z.string().optional().default(""),
});

export const privateConfig = privateConfigSchema.parse({
  neynarApiKey: process.env.NEYNAR_API_KEY || "",
  coingeckoApiKey: process.env.COINGECKO_API_KEY || "",
});
