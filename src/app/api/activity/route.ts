import { NextResponse } from "next/server";
import { getActivity } from "@/lib/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activity = await getActivity();
    return NextResponse.json(
      { activity },
      { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } }
    );
  } catch (err) {
    console.error("activity fetch failed", err);
    return NextResponse.json({ error: "activity unavailable" }, { status: 500 });
  }
}
