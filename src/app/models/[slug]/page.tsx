import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/server/queries";
import { ProductDetail } from "@/components/site/ProductDetail";

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
    openGraph: {
      title: `${product.name} — OneUp Gaming`,
      description: product.short,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug);
  return <ProductDetail product={product} related={related} />;
}
