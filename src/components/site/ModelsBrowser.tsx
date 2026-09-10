"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, Loader2, Search, SlidersHorizontal } from "lucide-react";
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
      <section className="relative overflow-hidden border-b border-border bg-surface">
        {/* Soft brand wash so the header reads as a banner, not a plain strip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-brand opacity-15 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-9 sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-primary">
            <Boxes className="size-3" /> ASSET STORE
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            3D ASSET <span className="text-gradient">LIBRARY</span>
          </h1>
          <p className="mt-2 max-w-lg text-xs text-muted-foreground sm:text-sm">
            Game-ready models with clean topology, PBR textures and every major format included.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="glass flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 sm:max-w-md">
              <Search className="size-4 shrink-0 text-primary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models..."
                aria-label="Search models"
                className="w-full bg-transparent text-xs font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
              {isFetching && <Loader2 className="size-4 shrink-0 animate-spin text-primary" />}
            </div>
            <span className="shrink-0 rounded-xl border border-border bg-card px-3 py-2.5 text-[11px] font-bold tracking-wide">
              <span className="text-primary">{list.length}</span> ASSETS
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 border-b border-border pb-3 font-display text-xs font-black tracking-[0.18em] text-foreground">
            <SlidersHorizontal className="size-4 text-primary" /> FILTERS
          </div>

          <Filter title="Category">
            <div className="space-y-0.5">
              {["All", ...categories.map((c) => c.name)].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`block w-full rounded-md px-3 py-2 text-left text-xs transition-colors ${
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
            <div className="flex flex-wrap gap-1.5">
              {formats.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(format === f ? null : f)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    format === f
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Filter>

          <Filter title="Software">
            <div className="space-y-1.5 text-xs text-muted-foreground">
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
            <div className="flex gap-1.5">
              {[0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    minRating === r
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {r === 0 ? "Any" : `${r}+`}
                </button>
              ))}
            </div>
          </Filter>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-[11px] font-bold tracking-[0.16em] text-foreground">
              SORT BY
            </p>
            <div className="flex gap-1.5 overflow-x-auto">
              {sorts.map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
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

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>

          {isError && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
              <p className="font-display text-sm font-bold">COULDN&apos;T LOAD ASSETS</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                The catalogue service is unavailable. Check your MongoDB connection and refresh.
              </p>
            </div>
          )}

          {!isError && list.length === 0 && !isFetching && (
            <div className="mt-4 rounded-xl border border-border bg-card p-8 text-center">
              <p className="font-display text-base font-bold">NO ASSETS MATCH THOSE FILTERS</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
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
      <h3 className="mb-2.5 font-display text-[11px] font-black tracking-[0.16em] text-foreground">
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}
