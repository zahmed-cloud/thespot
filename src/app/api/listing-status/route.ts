import { NextResponse } from "next/server";
import { getBoard } from "@/lib/board";
import { serviceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Polled by /success after checkout. Answers one question: has the
 * webhook for this specific checkout landed yet? Matches the payment
 * row on the order's checkout_id (with client_ref as fallback), then
 * returns the credited listing and its live rank.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const checkoutId = params.get("checkout_id") ?? "";
  const clientRef = params.get("ref") ?? "";

  const db = serviceClient();
  if (!db) {
    // demo mode: pretend the top row was just credited so the page
    // can be designed against
    const board = await getBoard();
    const row = board[0];
    return NextResponse.json(
      row ? { status: "credited", rank: row.rank, listing: row } : { status: "pending" }
    );
  }

  if (!checkoutId && !clientRef) {
    return NextResponse.json({ status: "pending" });
  }

  let identityKey: string | null = null;

  if (checkoutId) {
    const { data } = await db
      .from("payments")
      .select("identity_key")
      .eq("raw_payload->data->>checkout_id", checkoutId)
      .eq("status", "paid")
      .maybeSingle();
    identityKey = data?.identity_key ?? null;
  }

  if (!identityKey && clientRef) {
    const { data } = await db
      .from("payments")
      .select("identity_key")
      .eq("raw_payload->data->metadata->>client_ref", clientRef)
      .eq("status", "paid")
      .maybeSingle();
    identityKey = data?.identity_key ?? null;
  }

  if (!identityKey) {
    return NextResponse.json({ status: "pending" });
  }

  const board = await getBoard();
  const row = board.find((r) => r.identity_key === identityKey);
  if (!row) return NextResponse.json({ status: "pending" });

  return NextResponse.json({ status: "credited", rank: row.rank, listing: row });
}
