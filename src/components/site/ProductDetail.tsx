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
    <main className="pt-28">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2">
        <div>
          <div className="glow-ring relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface">
            <Image
              src={gallery[active] ?? product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {gallery.map((g, i) => (
              <button
                key={`${g}-${i}`}
                onClick={() => setActive(i)}
                aria-label={`Show view ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded-xl border ${
                  active === i ? "border-primary" : "border-border"
                }`}
              >
                <Image
                  src={g}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-primary">
            {product.category.toUpperCase()}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            {product.name} — {product.category.toUpperCase().replace(/S$/, "")} ASSET
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-cyan text-cyan" /> {product.rating.toFixed(1)}
            </span>
            <span>{product.sales} sales</span>
          </div>
          <p className="mt-5 font-display text-4xl font-bold">{formatPrice(product.price)}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.short}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.formats.map((f) => (
              <span
                key={f}
                className="rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {["4K TEXTURES", "PBR MATERIALS", "GAME READY", "RIGGED"].map((t) => (
              <div key={t} className="glass flex items-center gap-2 rounded-xl px-4 py-3">
                <Check className="size-4 text-lime" />
                <span className="text-xs font-bold tracking-wide">{t}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => {
                add(product);
                router.push("/checkout");
              }}
              className="inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_18px_50px_-18px_var(--primary)] transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gradient-primary)" }}
            >
              BUY NOW <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => {
                add(product);
                toast.success(`${product.name} added to cart`);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-4 text-sm font-bold tracking-wide transition-colors hover:bg-secondary"
            >
              <ShoppingCart className="size-4" /> ADD TO CART
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-6 text-sm">
            {[
              ["License", "Standard commercial"],
              ["Compatibility", product.software.join(", ")],
              ["File size", product.fileSize],
              ["Polygon count", product.polygons],
              ["Texture resolution", product.textures],
              ["Delivery", "Instant secure download"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] tracking-[0.14em] text-muted-foreground">
                  {k!.toUpperCase()}
                </dt>
                <dd className="mt-0.5 text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-colors ${
                  tab === t ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-7 text-sm leading-relaxed text-muted-foreground">
            {tab === "DESCRIPTION" && <p className="max-w-3xl">{product.description}</p>}
            {tab === "FEATURES" && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-lime" /> {f}
                  </li>
                ))}
              </ul>
            )}
            {tab === "TECHNICAL INFO" && (
              <ul className="grid gap-2 sm:grid-cols-2">
                <li>Polygon count: {product.polygons}</li>
                <li>Texture resolution: {product.textures}</li>
                <li>Formats: {product.formats.join(" • ")}</li>
                <li>Software: {product.software.join(", ")}</li>
                <li>File size: {product.fileSize}</li>
                <li>UVs: non-overlapping, packed</li>
              </ul>
            )}
            {tab === "LICENSE" && (
              <p className="max-w-3xl">
                Standard commercial license: use this asset in unlimited personal and commercial game
                projects. Redistribution or resale of the source files, on their own or as part of an
                asset pack, is not permitted.
              </p>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface/50">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <h2 className="font-display text-3xl font-bold">YOU MAY ALSO LIKE</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
