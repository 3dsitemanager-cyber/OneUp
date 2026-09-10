"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add, has } = useCart();
  const inCart = has(product.slug);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[0_20px_46px_-28px_var(--brand-blue)]">
      <Link href={`/models/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-white">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-white">
            {product.category.toUpperCase()}
          </span>
          {product.isNew && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold tracking-wide text-primary-foreground">
              NEW
            </span>
          )}
          <span className="glass absolute bottom-2.5 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex">
            <Eye className="size-3" /> QUICK VIEW
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/models/${product.slug}`}>
            <h3 className="font-display text-sm font-bold leading-tight transition-colors group-hover:text-brand">
              {product.name}
            </h3>
          </Link>
          <button
            aria-label="Add to wishlist"
            onClick={() => toast.success(`${product.name} saved to wishlist`)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
          >
            <Heart className="size-3.5" />
          </button>
        </div>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {product.short}
        </p>
        <div className="flex flex-wrap gap-1">
          {product.formats.map((f) => (
            <span
              key={f}
              className="rounded border border-border px-1.5 py-0.5 text-[9px] font-bold text-foreground"
            >
              {f}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
              <Star className="size-2.5 fill-gold text-gold" />
              {product.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">({product.sales})</span>
            </div>
            <p className="font-display text-sm font-bold text-primary">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={() => {
              add(product);
              toast.success(`${product.name} added to cart`);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-10px_var(--primary)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ShoppingCart className="size-3" />
            {inCart ? "IN CART" : "ADD TO CART"}
          </button>
        </div>
      </div>
    </article>
  );
}
