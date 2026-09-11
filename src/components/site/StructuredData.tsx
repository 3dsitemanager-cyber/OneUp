import { getSiteUrl } from "@/lib/site-url";
import type { Product } from "@/lib/types";

/**
 * Schema.org JSON-LD.
 *
 * This is what lets a search result carry a price, a rating and an in-stock
 * badge instead of a bare blue link. Rendered server-side into a script tag —
 * crawlers read it, browsers ignore it.
 *
 * The content mirrors what the page actually shows. Marking up a price or a
 * rating the page does not display is a structured-data violation and can cost
 * the site its rich results.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own serialised documents, not raw user
      // input, and JSON.stringify escapes the quotes that could break out.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Sitewide identity + the search box target. Render once, in the layout. */
export function SiteStructuredData() {
  const base = getSiteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "OneUp Gaming",
          url: base,
          logo: `${base}/assets/logo.png`,
          description:
            "Marketplace for game-ready 3D characters, environments, vehicles and props with 4K PBR textures and instant digital delivery.",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "OneUp Gaming",
          url: base,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${base}/models?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}

/** One product, for the detail page. */
export function ProductStructuredData({ product }: { product: Product }) {
  const base = getSiteUrl();
  const url = `${base}/models/${product.slug}`;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short || product.description,
    sku: product.slug,
    category: product.category,
    ...(product.image ? { image: [absolute(product.image, base)] } : {}),
    brand: { "@type": "Brand", name: "OneUp Gaming" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      // Digital goods, delivered instantly — no shipping to declare.
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "OneUp Gaming" },
    },
  };

  // Only claim a rating when there is a real one behind it: a fabricated
  // aggregateRating is exactly what earns a manual action.
  if (product.rating > 0 && product.sales > 0) {
    data["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.sales,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return <JsonLd data={data} />;
}

/** Breadcrumbs so search results show the path, not just the URL. */
export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const base = getSiteUrl();

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${base}${item.path}`,
        })),
      }}
    />
  );
}

/** Cloudinary URLs are already absolute; local ones need the origin. */
function absolute(src: string, base: string): string {
  return /^https?:\/\//.test(src) ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
}
