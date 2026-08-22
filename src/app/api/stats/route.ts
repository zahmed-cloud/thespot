import { NextResponse } from "next/server";
import { getStats } from "@/lib/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" },
    });
  } catch (err) {
    console.error("stats fetch failed", err);
    return NextResponse.json({ error: "stats unavailable" }, { status: 500 });
  }
}
