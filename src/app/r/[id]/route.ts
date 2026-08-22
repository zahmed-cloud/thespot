import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { clientIp } from "@/lib/ratelimit";
import { serviceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const salt = process.env.CLICK_SALT ?? "thespot-default-salt";
  const ipHash = createHash("sha256")
    .update(`${salt}:${clientIp(req)}`)
    .digest("hex");

  // record_click dedupes per ip hash per listing per 60s and returns the
  // destination, or null for an unknown listing.
  const { data: destination, error } = await db.rpc("record_click", {
    p_listing_id: id,
    p_ip_hash: ipHash,
  });

  if (error || !destination || !/^https?:\/\//.test(destination)) {
    if (error) console.error("record_click failed", error);
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  return NextResponse.redirect(destination, 302);
}
