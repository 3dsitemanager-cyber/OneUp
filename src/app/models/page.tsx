import type { Metadata } from "next";
import { getCategories, getProducts } from "@/server/queries";
import { ModelsBrowser } from "@/components/site/ModelsBrowser";

export const metadata: Metadata = {
  title: "3D Asset Library — OneUp Gaming Marketplace",
  description:
    "Browse premium game-ready 3D assets by category, price, format and software compatibility.",
  openGraph: {
    title: "3D Asset Library — OneUp Gaming",
    description: "Explore premium game-ready 3D assets.",
  },
};

export const revalidate = 0;

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialCategory = category ?? "All";

  const [categories, initialProducts] = await Promise.all([
    getCategories(),
    getProducts({ category: initialCategory }),
  ]);

  return (
    <main className="pt-28">
      <ModelsBrowser
        categories={categories}
        initialProducts={initialProducts}
        initialCategory={initialCategory}
      />
    </main>
  );
}
