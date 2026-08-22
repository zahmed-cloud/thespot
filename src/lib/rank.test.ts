import { describe, expect, it } from "vitest";
import { previewRank, rankBoard } from "./rank";
import type { Listing } from "./types";

function row(key: string, cents: number, createdAt: string): Listing {
  return {
    id: key,
    identity_key: key,
    display_url: `https://${key}`,
    title: key,
    description: null,
    total_paid: cents,
    clicks: 0,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

const board = [
  row("a.com", 24000, "2026-08-01T00:00:00Z"),
  row("b.com", 9000, "2026-08-02T00:00:00Z"),
  row("c.com", 9000, "2026-08-03T00:00:00Z"),
  row("d.com", 500, "2026-08-04T00:00:00Z"),
];

describe("rankBoard", () => {
  it("sorts by total_paid desc, ties broken by created_at asc", () => {
    const ranked = rankBoard([...board].reverse());
    expect(ranked.map((r) => r.identity_key)).toEqual([
      "a.com",
      "b.com", // older of the $90 tie keeps the higher rank
      "c.com",
      "d.com",
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });
});

describe("previewRank", () => {
  it("a new listing loses every tie", () => {
    expect(previewRank(board, 9000, null)).toBe(4);
    expect(previewRank(board, 9001, null)).toBe(2);
    expect(previewRank(board, 24001, null)).toBe(1);
    expect(previewRank(board, 500, null)).toBe(5);
  });

  it("a top-up keeps its created_at for tie breaks", () => {
    // c.com topping up to exactly b.com's total: b is older, b stays above
    expect(previewRank(board, 9000, board[2])).toBe(3);
    // b.com at the same total sits above c.com
    expect(previewRank(board, 9000, board[1])).toBe(2);
    // c.com passing a.com takes #1
    expect(previewRank(board, 25000, board[2])).toBe(1);
  });
});
