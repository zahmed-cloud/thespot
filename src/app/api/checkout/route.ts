import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Polar } from "@polar-sh/sdk";
import { isCategory } from "@/lib/categories";
import { normalizeIdentity } from "@/lib/identity";
import { encodePlatform, resolveFavicon } from "@/lib/logos";
import { containsBlockedTerm } from "@/lib/moderation";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { serviceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const FAIL = { error: "did not go through. no money moved. try again." };

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`)) {
    return NextResponse.json(
      { error: "slow down. five tries a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(FAIL, { status: 400 });
  }

  const { url, title, description, category, amount_dollars } = (body ?? {}) as {
    url?: unknown;
    title?: unknown;
    description?: unknown;
    category?: unknown;
    amount_dollars?: unknown;
  };

  if (typeof url !== "string") {
    return NextResponse.json(FAIL, { status: 400 });
  }
  const desc = typeof description === "string" ? description.trim() : "";

  const identity = normalizeIdentity(url);
  if (!identity) {
    return NextResponse.json(
      { error: "that is not a url or an @handle." },
      { status: 400 }
    );
  }

  // title is optional: default to the domain, or the handle itself
  const fallbackTitle =
    identity.kind === "handle"
      ? `@${identity.identityKey.slice(2)}`
      : identity.identityKey.split("/")[0];
  const cleanTitle =
    (typeof title === "string" ? title.trim() : "") || fallbackTitle;

  if (cleanTitle.length > 60) {
    return NextResponse.json(
      { error: "title maxes out at 60 characters." },
      { status: 400 }
    );
  }

  // category comes from the fixed list, nothing else
  if (typeof category !== "string" || !isCategory(category)) {
    return NextResponse.json(
      { error: "pick a category from the list." },
      { status: 400 }
    );
  }
  if (desc.length > 140) {
    return NextResponse.json(
      { error: "description maxes out at 140 characters." },
      { status: 400 }
    );
  }
  if (containsBlockedTerm(cleanTitle) || containsBlockedTerm(desc)) {
    return NextResponse.json(
      { error: "that title or description is not going on the board." },
      { status: 400 }
    );
  }

  if (
    typeof amount_dollars !== "number" ||
    !Number.isInteger(amount_dollars) ||
    amount_dollars < 1 ||
    amount_dollars > 1_000_000
  ) {
    return NextResponse.json(
      { error: "whole dollars only." },
      { status: 400 }
    );
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json(
      { error: "payments are not wired up yet." },
      { status: 503 }
    );
  }

  const { data: existing, error: lookupError } = await db
    .from("listings")
    .select("identity_key, total_paid")
    .eq("identity_key", identity.identityKey)
    .maybeSingle();

  if (lookupError) {
    console.error("checkout lookup failed", lookupError);
    return NextResponse.json(FAIL, { status: 500 });
  }

  const isTopup = Boolean(existing);
  const minimum = isTopup ? 1 : 5;
  if (amount_dollars < minimum) {
    return NextResponse.json(
      {
        error: isTopup
          ? "top-ups start at $1."
          : "$5 minimum for a new listing.",
      },
      { status: 400 }
    );
  }

  if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_PRODUCT_ID) {
    return NextResponse.json(
      { error: "payments are not wired up yet." },
      { status: 503 }
    );
  }

  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const bidCents = amount_dollars * 100;

  // logo resolution happens here, at submit time, server-side: known
  // platform mark first, then a verified favicon fetch. resolving in the
  // browser at render time is what produces grey-globe boards.
  const logo =
    encodePlatform(identity.identityKey) ??
    (identity.kind === "url" ? await resolveFavicon(identity.identityKey) : null);

  const clientRef = randomUUID();

  try {
    const checkout = await polar.checkouts.create({
      products: [process.env.POLAR_PRODUCT_ID!],
      amount: bidCents,
      // polar substitutes {CHECKOUT_ID}; /success polls listing-status
      // with it until the webhook lands
      successUrl: `${site}/success?checkout_id={CHECKOUT_ID}&ref=${clientRef}&key=${encodeURIComponent(identity.identityKey)}`,
      // where the buyer lands if they back out of the hosted checkout
      returnUrl: `${site}/cancelled`,
      // metadata identifies WHO. the webhook reads the amount from the
      // order object, never from here, so a tampered checkout url cannot
      // buy a bigger total than was actually paid. polar rejects
      // empty-string values, so optional fields are omitted when empty.
      metadata: {
        identity_key: identity.identityKey,
        display_url: identity.displayUrl,
        title: cleanTitle,
        ...(desc ? { description: desc } : {}),
        category,
        ...(logo ? { favicon_url: logo } : {}),
        bid_cents: String(bidCents),
        is_topup: String(isTopup),
        existing_total_cents: String(existing?.total_paid ?? 0),
        client_ref: clientRef,
      },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("polar checkout create failed", err);
    return NextResponse.json(FAIL, { status: 502 });
  }
}
