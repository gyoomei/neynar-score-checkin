import { NextRequest } from "next/server";
import { publicConfig } from "@/config/public-config";
import {
  getShareImageResponse,
  parseNextRequestSearchParams,
} from "@/neynar-farcaster-sdk/nextjs";

// Cache for 1 hour - query strings create separate cache entries
export const revalidate = 3600;

const { appEnv, heroImageUrl, imageUrl } = publicConfig;

const showDevWarning = appEnv !== "production";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  const searchParams = parseNextRequestSearchParams(request);
  const score = searchParams.score ?? null;
  const username = searchParams.username ?? null;

  return getShareImageResponse(
    { type, heroImageUrl, imageUrl, showDevWarning },
    // Overlay — every <div> has display: "flex" (Satori requirement)
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        width: "100%",
        height: "100%",
        padding: 48,
        backgroundImage: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
      }}
    >
      {/* Top-left brand header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: 48,
          left: 48,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#1D4ED8",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "white",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: "bold",
              color: "#1E3A5F",
              letterSpacing: -0.5,
            }}
          >
            Neynar Score
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 16,
            color: "#3B82F6",
            letterSpacing: 0.3,
          }}
        >
          Farcaster reputation, measured.
        </div>
      </div>

      {/* Blue accent divider line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 130,
          left: 48,
          width: 280,
          height: 2,
          backgroundColor: "#BFDBFE",
          borderRadius: 2,
        }}
      />

      {/* Bottom-left score card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          borderRadius: 20,
          padding: "28px 36px",
          boxShadow: "0 4px 24px rgba(59, 130, 246, 0.15)",
          border: "1.5px solid #BFDBFE",
          minWidth: 260,
        }}
      >
        {username && (
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#3B82F6",
              fontWeight: 600,
            }}
          >
            @{username}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: score ? 64 : 48,
              fontWeight: "bold",
              color: "#1E3A5F",
              lineHeight: 1,
              letterSpacing: -1,
            }}
          >
            {score ?? "—"}
          </div>
          {score && (
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#60A5FA",
                paddingBottom: 10,
                fontWeight: 600,
              }}
            >
              Neynar Score
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 6,
            borderRadius: 4,
            backgroundColor: "#DBEAFE",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "100%",
              width: score ? `${Math.min(parseFloat(score.replace(",", ".")), 1) * 100}%` : "0%",
              backgroundImage:
                "linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </div>,
  );
}
