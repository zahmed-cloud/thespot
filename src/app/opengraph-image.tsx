import { ImageResponse } from "next/og";
import { getBoard } from "@/lib/board";

export const runtime = "nodejs";
export const alt = "thespot.lol — the top spot costs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share image carries the live top-spot price. */
export default async function OpengraphImage() {
  let topCents = 0;
  try {
    topCents = (await getBoard())[0]?.total_paid ?? 0;
  } catch {
    // price stays 0 if the db is unreachable; the image still renders
  }
  const price = `$${Math.round(topCents / 100).toLocaleString("en-US")}`;

  return new ImageResponse(
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
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
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
        <div style={{ marginTop: 36, fontSize: 28, color: "#4A5060" }}>
          the top spot costs
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: "-0.045em",
          }}
        >
          {price}
        </div>
        <div style={{ marginTop: 20, fontSize: 24, color: "#868D9C" }}>
          thespot.lol — rank is the money. that is the whole thing.
        </div>
      </div>
    ),
    size
  );
}
