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

  const data = await fetchNeynarScore(fid);
  if (!data) {
    return NextResponse.json(
      { error: `Score for FID ${fid} not found.` },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
