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

// See the note on the homepage: cached for a minute, not per request.
export const revalidate = 60;

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialCategory = category ?? "All";

  const [categories, initialProducts] = await Promise.all([
    getCategories({ onlyWithProducts: true }),
    getProducts({ category: initialCategory, listOnly: true }),
  ]);

  return (
    <main className="pt-24">
      <ModelsBrowser
        categories={categories}
        initialProducts={initialProducts}
        initialCategory={initialCategory}
      />
    </main>
  );
}
