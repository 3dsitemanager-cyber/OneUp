"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/ProductCard";

const tabs = ["DESCRIPTION", "FEATURES", "TECHNICAL INFO", "LICENSE"] as const;

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { add } = useCart();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<(typeof tabs)[number]>("DESCRIPTION");

  const gallery = product.gallery.length > 0 ? product.gallery : [product.image];

  return (
    <main className="pt-24">
      {/* The viewer takes the wider column — the gallery is the page's subject. */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.85fr_1fr]">
        <div>
          {/* Landscape viewer, like a marketplace render shot — not a square crop. */}
          <div className="glow-ring relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-surface">
            <Image
              src={gallery[active] ?? product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover"
            />
            {gallery.length > 1 && (
              <span className="absolute left-3 top-3 rounded-md bg-foreground/75 px-2 py-0.5 text-[11px] font-bold text-background">
                {active + 1}/{gallery.length}
              </span>
            )}
          </div>
          {/* One scrollable strip so 8 views stay on a single row. */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {gallery.map((g, i) => (
              <button
                key={`${g}-${i}`}
                onClick={() => setActive(i)}
                aria-label={`Show view ${i + 1}`}
                className={`relative aspect-[16/9] w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  active === i ? "border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <Image
                  src={g}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-primary">
            {product.category.toUpperCase()}
          </span>
          <h1 className="mt-2.5 font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            {product.name} — {product.category.toUpperCase().replace(/S$/, "")} ASSET
          </h1>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Star className="size-3.5 fill-gold text-gold" /> {product.rating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">{product.sales} sales</span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-gradient">
            {formatPrice(product.price)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{product.short}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {product.formats.map((f) => (
              <span
                key={f}
                className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>

          {product.highlights.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1 xl:grid-cols-2">
              {product.highlights.map((t) => (
                <div key={t} className="glass flex items-center gap-2 rounded-lg px-3 py-2">
                  <Check className="size-3.5 shrink-0 text-lime" />
                  <span className="text-[11px] font-bold tracking-wide">{t}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                add(product);
                router.push("/checkout");
              }}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-xs font-bold tracking-wide text-primary-foreground shadow-[0_14px_40px_-18px_var(--primary)] transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gradient-primary)" }}
            >
              BUY NOW <ArrowRight className="size-3.5" />
            </button>
            <button
              onClick={() => {
                add(product);
                toast.success(`${product.name} added to cart`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-xs font-bold tracking-wide transition-colors hover:bg-secondary"
            >
              <ShoppingCart className="size-3.5" /> ADD TO CART
            </button>
          </div>

          <dl className="mt-6 grid gap-x-5 gap-y-2.5 border-t border-border pt-4 text-xs sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              ["License", product.license],
              ["Compatibility", product.software.join(", ")],
              ["File size", product.fileSize],
              ["Polygon count", product.polygons],
              ["Texture resolution", product.textures],
              ["Delivery", product.delivery],
            ]
              // A row the admin left blank is dropped rather than shown empty.
              .filter(([, v]) => v && v.trim())
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="font-display text-[10px] font-bold tracking-[0.14em] text-foreground">
                    {k!.toUpperCase()}
                  </dt>
                  <dd className="mt-0.5 text-muted-foreground">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex gap-1 overflow-x-auto border-b border-border p-1.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-md px-3 py-1.5 font-display text-[11px] font-bold tracking-wide transition-colors ${
                  tab === t
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-5 text-xs leading-relaxed text-muted-foreground">
            {tab === "DESCRIPTION" && <p className="max-w-3xl">{product.description}</p>}
            {tab === "FEATURES" && (
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-3.5 shrink-0 text-lime" /> {f}
                  </li>
                ))}
              </ul>
            )}
            {tab === "TECHNICAL INFO" && (
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {(
                  [
                    ["Polygon count", product.polygons],
                    ["Texture resolution", product.textures],
                    ["Formats", product.formats.join(" • ")],
                    ["Software", product.software.join(", ")],
                    ["File size", product.fileSize],
                    ["UVs", product.uvs],
                  ] as const
                )
                  .filter(([, v]) => v && v.trim())
                  .map(([k, v]) => (
                    <li key={k}>
                      <span className="font-semibold text-foreground">{k}:</span> {v}
                    </li>
                  ))}
              </ul>
            )}
            {tab === "LICENSE" && (
              <div className="max-w-3xl">
                <p className="font-semibold text-foreground">{product.license}</p>
                {product.licenseTerms && (
                  <p className="mt-2 whitespace-pre-wrap">{product.licenseTerms}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface/50">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
            <h2 className="font-display text-xl font-bold">YOU MAY ALSO LIKE</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
