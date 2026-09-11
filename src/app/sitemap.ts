import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/server/queries";
import { getSiteUrl } from "@/lib/site-url";

// Regenerated hourly rather than per request: a crawler hitting this should not
// re-query the catalogue every time, and new listings can wait an hour.
export const revalidate = 3600;

/**
 * /sitemap.xml — every public URL, so search engines find listings without
 * having to crawl their way in from the homepage.
 *
 * Admin, checkout, cart and downloads are deliberately absent: they are either
 * private or have nothing to rank.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/models`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/complaint`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // A database that is down must not fail the whole sitemap — the static pages
  // are still worth serving.
  try {
    const [slugs, categories] = await Promise.all([
      getAllProductSlugs(),
      getCategories({ onlyWithProducts: true }),
    ]);

    const products: MetadataRoute.Sitemap = slugs.map((slug) => ({
      url: `${base}/models/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/models?category=${encodeURIComponent(c.name)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...products, ...categoryPages];
  } catch (error) {
    console.error("[sitemap] catalogue unavailable:", error);
    return staticPages;
  }
}
