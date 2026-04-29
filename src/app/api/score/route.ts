import { NextRequest, NextResponse } from "next/server";
import { fetchNeynarScore } from "@/features/score/actions";

export async function GET(request: NextRequest) {
  const fidParam = request.nextUrl.searchParams.get("fid")?.trim() ?? "";
  const fid = Number.parseInt(fidParam, 10);

  if (!Number.isInteger(fid) || fid <= 0) {
    return NextResponse.json(
      { error: "Enter a valid Farcaster FID." },
      { status: 400 },
    );
  }

  try {
    const data = await fetchNeynarScore(fid);
    if (!data) {
      return NextResponse.json(
        { error: `Score for FID ${fid} not found.` },
        { status: 404 },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[score-api] Failed to fetch score", {
      fid,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unable to check score right now. Please try again." },
      { status: 500 },
    );
  }
}
