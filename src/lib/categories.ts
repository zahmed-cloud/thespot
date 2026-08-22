/**
 * Fixed category list. Users pick from these, never create their own.
 * The slug is what gets stored on the listing and used in filter urls.
 */
export const CATEGORIES = [
  { slug: "ai-tools", label: "ai tools" },
  { slug: "dev-tools", label: "dev tools" },
  { slug: "marketing", label: "marketing" },
  { slug: "seo", label: "seo" },
  { slug: "saas", label: "saas" },
  { slug: "design", label: "design" },
  { slug: "crypto", label: "crypto" },
  { slug: "agencies", label: "agencies" },
  { slug: "jobs", label: "jobs" },
  { slug: "newsletters", label: "newsletters" },
  { slug: "games", label: "games" },
  { slug: "health", label: "health" },
  { slug: "other", label: "other" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function isCategory(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? "other";
}
