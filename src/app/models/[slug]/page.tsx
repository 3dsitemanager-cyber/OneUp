import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/server/queries";
import { ProductDetail } from "@/components/site/ProductDetail";
import {
  BreadcrumbStructuredData,
  ProductStructuredData,
} from "@/components/site/StructuredData";

// See the note on the homepage: cached for a minute, not per request.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    return { title: "Asset not found — OneUp Gaming", robots: { index: false } };
  }

  return {
    title: `${product.name} — 3D Game Asset`,
    description: product.short,
    // Tells search engines which URL is the real one, so query strings and
    // www/non-www variants don't compete with each other.
    alternates: { canonical: `/models/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — OneUp Gaming`,
      description: product.short,
      url: `/models/${product.slug}`,
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — OneUp Gaming`,
      description: product.short,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug);

  return (
    <>
      {/* Server-rendered so crawlers see it in the initial HTML. */}
      <ProductStructuredData product={product} />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", path: "/" },
          { name: "Assets", path: "/models" },
          { name: product.category, path: `/models?category=${encodeURIComponent(product.category)}` },
          { name: product.name, path: `/models/${product.slug}` },
        ]}
      />
      <ProductDetail product={product} related={related} />
    </>
  );
}
