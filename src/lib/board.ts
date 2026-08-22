import { serviceClient } from "./supabase-server";
import { rankBoard } from "./rank";
import type { BoardStats, Listing, RankedListing } from "./types";

/**
 * Demo rows shown only when Supabase env vars are absent (local design
 * work before the project is wired up). With env set, the database is
 * always the source of truth.
 */
const DEMO_ROWS: Listing[] = [
  ["outboundos.app", "outbound os", "free linkedin client-getting tool", 24000, 142, 6],
  ["coldplunge.dev", "cold plunge tracker", "logs your plunges. that is it.", 18000, 98, 5],
  ["x:jamil", "@jamil", "posts about building things", 12000, 61, 5.2],
  ["ratemysetup.lol", "rate my setup", "strangers judge your desk", 9000, 44, 4],
  ["tinyinvoice.co", "tiny invoice", "invoices for people who hate invoices", 9000, 37, 3],
  ["x:sana_builds", "@sana_builds", "shipping one product a month", 7000, 29, 2],
  ["plaintextsports.com", "plain text sports", "scores with zero javascript", 600, 12, 1],
  ["sundaycode.club", "sunday code club", "a newsletter for weekend builders", 500, 8, 0.4],
].map(([key, title, description, cents, clicks, daysAgo], i) => {
  const created = new Date(Date.now() - (daysAgo as number) * 86400000).toISOString();
  const k = key as string;
  return {
    id: `demo-${i}`,
    identity_key: k,
    display_url: k.startsWith("x:") ? `https://x.com/${k.slice(2)}` : `https://${k}`,
    title: title as string,
    description: description as string,
    total_paid: cents as number,
    clicks: clicks as number,
    created_at: created,
    updated_at: created,
  };
});

export async function getBoard(): Promise<RankedListing[]> {
  const db = serviceClient();
  if (!db) return rankBoard(DEMO_ROWS);

  const { data, error } = await db
    .from("listings")
    .select("*")
    .order("total_paid", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`board query failed: ${error.message}`);
  return rankBoard((data ?? []) as Listing[]);
}

export async function getStats(): Promise<BoardStats> {
  const board = await getBoard();
  return {
    total_listings: board.length,
    total_raised_cents: board.reduce((sum, row) => sum + row.total_paid, 0),
    top_bid_cents: board[0]?.total_paid ?? 0,
  };
}
