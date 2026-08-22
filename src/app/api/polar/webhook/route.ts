import { NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { isCategory } from "@/lib/categories";
import { serviceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // raw bytes first: signature verification runs over the exact body,
  // so nothing may parse it as json before this point.
  const raw = await req.text();

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(
      raw,
      Object.fromEntries(req.headers.entries()),
      process.env.POLAR_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("webhook signature verification failed");
      return NextResponse.json({ error: "invalid signature" }, { status: 403 });
    }
    throw err;
  }

  const db = serviceClient();
  if (!db) {
    console.error("webhook received but supabase env is missing");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  if (event.type === "order.paid") {
    const order = event.data;
    const meta = (order.metadata ?? {}) as Record<string, unknown>;

    const identityKey = str(meta.identity_key);
    const displayUrl = str(meta.display_url);
    const title = str(meta.title);
    const description = str(meta.description);
    const rawCategory = str(meta.category);
    const category = isCategory(rawCategory) ? rawCategory : "other";
    const faviconUrl = str(meta.favicon_url) || null;

    // the real paid amount comes from the order, never from metadata.
    // netAmount is what the buyer chose to pay, before polar's
    // merchant-of-record tax on top.
    const amountCents = order.netAmount;
    const isTopup = str(meta.is_topup) === "true";
    const minCents = isTopup ? 100 : 500;

    if (!identityKey || !displayUrl || !title) {
      console.error("order.paid missing metadata", order.id, meta);
      // 200: retrying will never fix missing metadata
      return NextResponse.json({ received: true, skipped: "bad metadata" });
    }
    if (
      !Number.isInteger(amountCents) ||
      amountCents < minCents ||
      amountCents % 100 !== 0
    ) {
      console.error("order.paid invalid amount", order.id, amountCents);
      return NextResponse.json({ received: true, skipped: "bad amount" });
    }

    // single transactional rpc: insert the payments row (unique
    // polar_order_id = idempotency gate) and credit the listing.
    const { error } = await db.rpc("handle_order_paid", {
      p_order_id: order.id,
      p_identity_key: identityKey,
      p_display_url: displayUrl,
      p_title: title,
      p_description: description,
      p_amount_cents: amountCents,
      p_category: category,
      p_favicon_url: faviconUrl,
      p_raw: JSON.parse(raw),
    });

    if (error) {
      console.error("handle_order_paid failed", order.id, error);
      return NextResponse.json({ error: "db write failed" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  if (event.type === "order.refunded") {
    const order = event.data;
    const { error } = await db.rpc("handle_order_refunded", {
      p_order_id: order.id,
      p_refunded_cents: order.refundedAmount,
      p_raw: JSON.parse(raw),
    });
    if (error) {
      console.error("handle_order_refunded failed", order.id, error);
      return NextResponse.json({ error: "db write failed" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  console.log("webhook ignored", event.type);
  return NextResponse.json({ received: true });
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
