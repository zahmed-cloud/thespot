export type Listing = {
  id: string;
  identity_key: string;
  display_url: string;
  title: string;
  description: string | null;
  total_paid: number; // cents
  clicks: number;
  created_at: string;
  updated_at: string;
};

export type RankedListing = Listing & { rank: number };

export type BoardStats = {
  total_listings: number;
  total_raised_cents: number;
  top_bid_cents: number;
};
