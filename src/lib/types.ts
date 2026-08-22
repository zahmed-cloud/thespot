export type Listing = {
  id: string;
  identity_key: string;
  display_url: string;
  title: string;
  description: string | null;
  total_paid: number; // cents
  clicks: number;
  category: string;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RankedListing = Listing & { rank: number };

/** Condensed row used for rank previews and the hero price on the client. */
export type BoardTotal = Pick<Listing, "identity_key" | "total_paid" | "created_at">;

export type ActivityItem = {
  id: string;
  listing_id: string | null;
  title: string;
  favicon_url: string | null;
  identity_key: string;
  rank: number | null;
  bid_cents: number;
  created_at: string;
};

export type BoardPage = {
  rows: RankedListing[];
  total: number;
  page: number;
  perPage: number;
  topTotalCents: number;
  totals: BoardTotal[];
};

export type BoardStats = {
  total_listings: number;
  total_raised_cents: number;
  top_bid_cents: number;
};
