import type { Listing, RankedListing } from "./types";

/**
 * The one sorting rule: total_paid descending, ties broken by created_at
 * ascending (the older listing keeps the higher rank).
 */
export function sortBoard<T extends Listing>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (b.total_paid !== a.total_paid) return b.total_paid - a.total_paid;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function rankBoard(rows: Listing[]): RankedListing[] {
  return sortBoard(rows).map((row, i) => ({ ...row, rank: i + 1 }));
}

/**
 * Where a bid would land. For a new listing the prospective row loses every
 * tie (its created_at is now, so every existing equal total ranks above it).
 * For a top-up the row keeps its original created_at, so it only sits below
 * equal totals that are older than it.
 */
export function previewRank(
  rows: Listing[],
  prospectiveTotalCents: number,
  existing: Listing | null
): number {
  let above = 0;
  for (const row of rows) {
    if (existing && row.identity_key === existing.identity_key) continue;
    if (row.total_paid > prospectiveTotalCents) {
      above++;
    } else if (row.total_paid === prospectiveTotalCents) {
      if (!existing || new Date(row.created_at) < new Date(existing.created_at)) {
        above++;
      }
    }
  }
  return above + 1;
}

export function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
