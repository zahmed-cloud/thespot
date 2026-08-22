import { ImageResponse } from "next/og";
import { getStats } from "@/lib/board";

export const runtime = "nodejs";
export const revalidate = 60;

/**
 * The share card, generated live: every share shows the real current
 * top-spot price and listing count. Cached 60s so a spike does not
 * hammer the database.
 */
export async function GET() {
  let topCents = 0;
  let listings = 0;
  try {
    const stats = await getStats();
    topCents = stats.top_bid_cents;
    listings = stats.total_listings;
  } catch {
    // the image still renders with zeros if the db is unreachable
  }
  // an empty board's top spot costs the $5 minimum, never $0
  const price = `$${Math.round(Math.max(500, topCents) / 100).toLocaleString("en-US")}`;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(1200px 600px at 50% -10%, #FFFFFF 0%, #F7F8FA 55%, #F1F3F6 100%)",
          color: "#0B0D12",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <svg width="96" height="96" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 3 A13 13 0 1 1 15.9 3"
            stroke="#0B0D12"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="60 22"
            transform="rotate(-42 16 16)"
          />
          <circle cx="16" cy="16" r="6" fill="#0B0D12" />
        </svg>
        <div style={{ marginTop: 30, fontSize: 30, color: "#4A5060" }}>
          the top spot costs
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 140,
            fontWeight: 700,
            letterSpacing: "-0.045em",
          }}
        >
          {price}
        </div>
        <div style={{ marginTop: 16, fontSize: 30, fontWeight: 600 }}>
          $5 gets you on the board
        </div>
        <div style={{ marginTop: 14, fontSize: 24, color: "#868D9C" }}>
          {`thespot.lol · ${listings.toLocaleString("en-US")} listings and counting`}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  image.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );
  return image;
}
