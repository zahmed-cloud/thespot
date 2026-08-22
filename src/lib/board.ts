import { serviceClient } from "./supabase-server";
import { rankBoard } from "./rank";
import { CATEGORIES } from "./categories";
import type {
  ActivityItem,
  BoardPage,
  BoardStats,
  Listing,
  RankedListing,
} from "./types";

export const PER_PAGE = 50;

export function faviconFor(identityKey: string): string | null {
  if (identityKey.startsWith("x:")) return null;
  const domain = identityKey.split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

// ------------------------------------------------------------------
// demo data, shown only when supabase env vars are absent so the
// design can be worked on before the project is wired up. ~58 rows
// so every tier, both dividers, and page 2 all exist.
// ------------------------------------------------------------------

const DEMO_TOP: Array<[string, string, string, string, number, number]> = [
  // key, title, description, category, dollars, clicks
  ["requesty.ai", "requesty", "one api for every llm", "ai-tools", 14023, 1113],
  ["outboundos.app", "outbound os", "free linkedin client-getting tool", "marketing", 8100, 642],
  ["coldplunge.dev", "cold plunge tracker", "logs your plunges. that is it.", "health", 5250, 398],
  ["x:jamil", "@jamil", "posts about building things", "other", 3000, 261],
  ["ratemysetup.lol", "rate my setup", "strangers judge your desk", "design", 2400, 244],
  ["tinyinvoice.co", "tiny invoice", "invoices for people who hate invoices", "saas", 1900, 187],
  ["shipfast.club", "ship fast club", "accountability group for launching", "other", 1500, 149],
  ["x:sana_builds", "@sana_builds", "shipping one product a month", "other", 1200, 129],
  ["keywordgap.io", "keyword gap", "find what your rivals rank for", "seo", 990, 118],
  ["plaintextsports.com", "plain text sports", "scores with zero javascript", "games", 850, 112],
  ["darkmodemaker.com", "dark mode maker", "adds dark mode to any site", "dev-tools", 720, 96],
  ["hiredev.today", "hire dev today", "vetted contractors in 48 hours", "jobs", 640, 88],
  ["chartpaste.com", "chart paste", "paste data, get a chart", "dev-tools", 560, 81],
  ["copydeck.ai", "copy deck", "landing page copy that converts", "marketing", 500, 74],
  ["stackedwallet.xyz", "stacked wallet", "watch every chain in one place", "crypto", 450, 69],
  ["quietletter.com", "quiet letter", "a slow newsletter about focus", "newsletters", 400, 61],
  ["pixelgrader.com", "pixel grader", "roasts your ui in ten seconds", "design", 360, 55],
  ["sundaycode.club", "sunday code club", "a newsletter for weekend builders", "newsletters", 320, 49],
  ["formspree.lol", "form spree", "forms without a backend", "dev-tools", 290, 44],
  ["leadmagnet.gg", "lead magnet", "swipe file of 400 lead magnets", "marketing", 260, 40],
];

const DEMO_ROWS: Listing[] = (() => {
  const rows: Listing[] = [];
  const now = Date.now();
  DEMO_TOP.forEach(([key, title, description, category, dollars, clicks], i) => {
    const created = new Date(now - (40 - i) * 36e5 * 4).toISOString();
    rows.push({
      id: `demo-${i}`,
      identity_key: key,
      display_url: key.startsWith("x:") ? `https://x.com/${key.slice(2)}` : `https://${key}`,
      title,
      description,
      total_paid: dollars * 100,
      clicks,
      category,
      favicon_url: faviconFor(key),
      created_at: created,
      updated_at: new Date(now - (i + 2) * 31e5).toISOString(),
    });
  });
  // long tail: 38 more rows, $5 to $120, to fill tier 4 and page 2
  for (let i = 0; i < 38; i++) {
    const key = `sideproject${i + 1}.dev`;
    const created = new Date(now - (20 - i / 4) * 36e5 * 3).toISOString();
    rows.push({
      id: `demo-tail-${i}`,
      identity_key: key,
      display_url: `https://${key}`,
      title: `side project ${i + 1}`,
      description: i % 3 === 0 ? "a small thing that does one thing" : null,
      total_paid: Math.max(500, (120 - i * 3) * 100),
      clicks: Math.max(2, 40 - i),
      category: CATEGORIES[i % CATEGORIES.length].slug,
      favicon_url: faviconFor(key),
      created_at: created,
      updated_at: created,
    });
  }
  return rows;
})();

// ------------------------------------------------------------------
// reads
// ------------------------------------------------------------------

async function fetchAll(): Promise<Listing[]> {
  const db = serviceClient();
  if (!db) return DEMO_ROWS;

  const { data, error } = await db
    .from("listings")
    .select("*")
    .order("total_paid", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`board query failed: ${error.message}`);
  return (data ?? []) as Listing[];
}

export async function getBoard(): Promise<RankedListing[]> {
  return rankBoard(await fetchAll());
}

/**
 * One page of the board. With a category filter, ranks are recomputed
 * within the category — a small bid owns its small pond. totals and
 * topTotalCents always describe the full unfiltered board, for the hero
 * price and the global rank preview.
 */
export async function getBoardPage(
  category: string | null,
  page: number
): Promise<BoardPage> {
  const all = rankBoard(await fetchAll());
  const scoped = category
    ? all
        .filter((r) => r.category === category)
        .map((r, i) => ({ ...r, rank: i + 1 }))
    : all;

  const safePage = Math.max(1, Math.min(page, Math.max(1, Math.ceil(scoped.length / PER_PAGE))));
  return {
    rows: scoped.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    total: scoped.length,
    page: safePage,
    perPage: PER_PAGE,
    topTotalCents: all[0]?.total_paid ?? 0,
    totals: all.map(({ identity_key, total_paid, created_at }) => ({
      identity_key,
      total_paid,
      created_at,
    })),
  };
}

export async function getStats(): Promise<BoardStats> {
  const board = await getBoard();
  return {
    total_listings: board.length,
    total_raised_cents: board.reduce((sum, row) => sum + row.total_paid, 0),
    top_bid_cents: board[0]?.total_paid ?? 0,
  };
}

/** Five most recent paid bids, joined with their listing for the strip. */
export async function getActivity(): Promise<ActivityItem[]> {
  const db = serviceClient();
  const board = await getBoard();
  const byKey = new Map(board.map((r) => [r.identity_key, r]));

  if (!db) {
    // demo: fabricate recent bids from demo rows
    const picks = [10, 0, 4, 14, 7];
    return picks.map((i, n) => {
      const row = DEMO_ROWS[i];
      return {
        id: `demo-act-${i}`,
        listing_id: row.id,
        title: row.title,
        favicon_url: row.favicon_url,
        identity_key: row.identity_key,
        rank: byKey.get(row.identity_key)?.rank ?? null,
        bid_cents: [500, 2500, 700, 1200, 500][n],
        created_at: new Date(Date.now() - (n + 1) * 4 * 60000).toISOString(),
      };
    });
  }

  const { data, error } = await db
    .from("payments")
    .select("id, identity_key, amount_cents, created_at")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(`activity query failed: ${error.message}`);

  return (data ?? []).map((p) => {
    const row = byKey.get(p.identity_key);
    return {
      id: p.id,
      listing_id: row?.id ?? null,
      title: row?.title ?? p.identity_key,
      favicon_url: row?.favicon_url ?? faviconFor(p.identity_key),
      identity_key: p.identity_key,
      rank: row?.rank ?? null,
      bid_cents: p.amount_cents,
      created_at: p.created_at,
    };
  });
}
