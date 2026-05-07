import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template") || "gradient";
  const score = searchParams.get("score") || "0,00";
  const label = searchParams.get("label") || "Newcomer";
  const username = searchParams.get("username") || "user";

  const width = 800;
  const height = 800;

  if (template === "minimal") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
          }}
        >
          <div style={{ fontSize: 160, fontWeight: "bold", color: "#0F172A" }}>
            {score}
          </div>
          <div style={{ fontSize: 32, color: "#64748B", marginTop: 20 }}>
            {label}
          </div>
          <div style={{ fontSize: 24, color: "#94A3B8", marginTop: 40 }}>
            @{username}
          </div>
          <div style={{ fontSize: 20, color: "#CBD5E1", marginTop: 80 }}>
            Neynar Score
          </div>
        </div>
      ),
      { width, height }
    );
  }

  if (template === "gradient") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #9333EA 100%)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2), transparent 50%)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div style={{ fontSize: 160, fontWeight: "bold", color: "white" }}>
              {score}
            </div>
            <div
              style={{
                fontSize: 32,
                color: "rgba(255,255,255,0.9)",
                marginTop: 20,
                fontWeight: "600",
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.8)", marginTop: 40 }}>
              @{username}
            </div>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", marginTop: 80 }}>
              Farcaster Reputation
            </div>
          </div>
        </div>
      ),
      { width, height }
    );
  }

  if (template === "neon") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "black",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, transparent 50%, rgba(236,72,153,0.2) 100%)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 160,
                fontWeight: "bold",
                background: "linear-gradient(90deg, #22D3EE 0%, #EC4899 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {score}
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#22D3EE",
                marginTop: 20,
                fontWeight: "bold",
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 24, color: "#F9A8D4", marginTop: 40 }}>
              @{username}
            </div>
            <div style={{ fontSize: 20, color: "#64748B", marginTop: 80 }}>
              NEYNAR SCORE
            </div>
          </div>
        </div>
      ),
      { width, height }
    );
  }

  // dark template
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
          border: "1px solid #334155",
        }}
      >
        <div style={{ fontSize: 160, fontWeight: "bold", color: "white" }}>
          {score}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#60A5FA",
            marginTop: 20,
            fontWeight: "600",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 24, color: "#94A3B8", marginTop: 40 }}>
          @{username}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#64748B",
            marginTop: 80,
            letterSpacing: "0.1em",
          }}
        >
          NEYNAR SCORE
        </div>
      </div>
    ),
    { width, height }
  );
}
