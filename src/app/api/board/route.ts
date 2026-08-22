import { NextResponse } from "next/server";
import { getBoard } from "@/lib/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const board = await getBoard();
    return NextResponse.json(
      { board },
      { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } }
    );
  } catch (err) {
    console.error("board fetch failed", err);
    return NextResponse.json({ error: "board unavailable" }, { status: 500 });
  }
}
