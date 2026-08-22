import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thespot.lol";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "hourly", priority: 1 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE}/?category=${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
    { url: `${SITE}/rules`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/refunds`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
