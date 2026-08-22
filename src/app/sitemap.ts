import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thespot.lol";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, changeFrequency: "hourly", priority: 1, lastModified: now },
    ...CATEGORIES.map((c) => ({
      url: `${SITE}/c/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.7,
      lastModified: now,
    })),
    { url: `${SITE}/rules`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.2, lastModified: now },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2, lastModified: now },
    { url: `${SITE}/refunds`, changeFrequency: "yearly", priority: 0.2, lastModified: now },
  ];
}
