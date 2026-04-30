import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Neynar Score Check-in";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 120,
              fontWeight: "bold",
              color: "white",
              boxShadow: "0 20px 60px rgba(37, 99, 235, 0.4)",
            }}
          >
            N
          </div>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 20,
          }}
        >
          Neynar Score
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#64748B",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Check your Farcaster reputation score
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
