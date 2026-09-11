import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * /robots.txt — what crawlers may index, and where the sitemap lives.
 *
 * The disallowed paths are not a security measure (robots.txt is advisory and
 * public); they keep private or worthless pages out of search results. The
 * admin portal is protected by middleware and a session cookie regardless.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/checkout",
        "/checkout/",
        "/cart",
        "/downloads",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
