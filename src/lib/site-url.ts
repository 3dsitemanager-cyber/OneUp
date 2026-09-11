/**
 * The site's absolute base URL.
 *
 * Shared by the layout's metadataBase, the sitemap, robots.txt and the
 * structured data, so canonical links cannot drift apart between them.
 *
 * An env var that exists but is empty is a string, not undefined, so `??`
 * alone is not enough — `new URL("")` throws at build time. Falls back to the
 * host-assigned URL (Vercel sets VERCEL_URL without a scheme), then localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return "http://localhost:3000";
}
