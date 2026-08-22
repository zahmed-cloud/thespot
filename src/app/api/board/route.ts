import { NextResponse } from "next/server";
import { getBoardPage } from "@/lib/board";
import { isCategory } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const rawCategory = params.get("category") ?? "";
  const category = isCategory(rawCategory) ? rawCategory : null;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  try {
    const data = await getBoardPage(category, page);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" },
    });
  } catch (err) {
    console.error("board fetch failed", err);
    return NextResponse.json({ error: "board unavailable" }, { status: 500 });
  }
}
