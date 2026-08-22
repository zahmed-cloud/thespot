import type { BoardTotal, Listing, RankedListing } from "./types";

/**
 * The one sorting rule: total_paid descending, ties broken by created_at
 * ascending (the older listing keeps the higher rank).
 */
export function sortBoard<T extends BoardTotal>(rows: T[]): T[] {
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
  rows: BoardTotal[],
  prospectiveTotalCents: number,
  existing: BoardTotal | null
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

/** Visual tier for a rank: drives row size, tint, border, and padding. */
export function tierForRank(rank: number): 1 | 2 | 3 | 4 {
  if (rank <= 3) return 1;
  if (rank <= 10) return 2;
  if (rank <= 20) return 3;
  return 4;
}

export function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
