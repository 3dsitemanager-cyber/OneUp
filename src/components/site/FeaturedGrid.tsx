"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import type { Category, Product } from "@/lib/types";

/** Client-side tab filter over a catalogue already fetched on the server. */
export function FeaturedGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [filter, setFilter] = useState("All");

  // Tabs follow whatever the admin portal has created, not a fixed list.
  const filters = useMemo(() => ["All", ...categories.map((c) => c.name)], [categories]);

  const featured = useMemo(
    () => (filter === "All" ? products : products.filter((p) => p.category === filter)),
    [filter, products],
  );

  return (
    <>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border-2 px-5 py-2 text-xs font-bold tracking-wide transition-all ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_var(--primary)]"
                : "border-border bg-card text-foreground hover:border-brand hover:text-brand"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {featured.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
      {featured.length === 0 && (
        <p className="mt-8 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No assets in this category yet.
        </p>
      )}
    </>
  );
}
