"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import type { Category, Product } from "@/lib/types";

const formats = ["FBX", "BLEND", "OBJ", "GLTF"];
const softwares = ["Blender", "Unity", "Unreal Engine", "Maya"];
const sorts = ["Featured", "Newest", "Price Low → High", "Price High → Low", "Best Selling"];
const MAX_PRICE = 60;

type Props = {
  categories: Category[];
  initialProducts: Product[];
  initialCategory: string;
};

/** Filters run against GET /api/products so MongoDB does the work, not the browser. */
export function ModelsBrowser({ categories, initialProducts, initialCategory }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cat, setCat] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [format, setFormat] = useState<string | null>(null);
  const [software, setSoftware] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState(sorts[0]!);

  // Keep typing responsive without firing a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const params = new URLSearchParams();
  if (cat !== "All") params.set("category", cat);
  if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim());
  if (maxPrice < MAX_PRICE) params.set("maxPrice", String(maxPrice));
  if (minRating > 0) params.set("minRating", String(minRating));
  if (format) params.set("format", format);
  params.set("sort", sort);

  const isDefaultView =
    cat === initialCategory &&
    !debouncedQuery.trim() &&
    maxPrice === MAX_PRICE &&
    minRating === 0 &&
    !format &&
    sort === sorts[0];

  const { data, isFetching, isError } = useQuery({
    queryKey: ["products", params.toString()],
    queryFn: async (): Promise<Product[]> => {
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not load assets");
      return json.data as Product[];
    },
    initialData: isDefaultView ? initialProducts : undefined,
    placeholderData: (prev) => prev,
  });

  // Software is metadata rather than an indexed filter, so it is applied client-side.
  const list = (data ?? []).filter(
    (p) => software.length === 0 || software.every((s) => p.software.includes(s)),
  );

  const toggleSoftware = (s: string) =>
    setSoftware((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <>
      <section className="relative border-b border-border">
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">3D ASSET LIBRARY</h1>
          <p className="mt-3 text-sm text-muted-foreground">Explore premium game-ready assets.</p>
          <div className="glass mt-7 flex max-w-xl items-center gap-3 rounded-xl px-4 py-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              aria-label="Search models"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit space-y-7 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-muted-foreground">
            <SlidersHorizontal className="size-4" /> FILTERS
          </div>

          <Filter title="Category">
            <div className="space-y-1.5">
              {["All", ...categories.map((c) => c.name)].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    cat === c
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Filter>

          <Filter title={`Price — up to $${maxPrice}`}>
            <input
              type="range"
              min={15}
              max={MAX_PRICE}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="Maximum price"
              className="w-full accent-[var(--primary)]"
            />
          </Filter>

          <Filter title="File Format">
            <div className="flex flex-wrap gap-2">
              {formats.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(format === f ? null : f)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                    format === f
                      ? "border-primary text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Filter>

          <Filter title="Software">
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {softwares.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={software.includes(s)}
                    onChange={() => toggleSoftware(s)}
                    className="accent-[var(--primary)]"
                  />
                  {s}
                </label>
              ))}
            </div>
          </Filter>

          <Filter title="Rating">
            <div className="flex gap-2">
              {[0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                    minRating === r
                      ? "border-primary text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {r === 0 ? "Any" : `${r}+`}
                </button>
              ))}
            </div>
          </Filter>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{list.length}</span> assets found
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {sorts.map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold ${
                    sort === s
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>

          {isError && (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-10 text-center">
              <p className="font-display text-lg font-bold">COULDN&apos;T LOAD ASSETS</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The catalogue service is unavailable. Check your MongoDB connection and refresh.
              </p>
            </div>
          )}

          {!isError && list.length === 0 && !isFetching && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-14 text-center">
              <p className="font-display text-xl font-bold">NO ASSETS MATCH THOSE FILTERS</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the price range or clearing the format filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Filter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground">
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}
