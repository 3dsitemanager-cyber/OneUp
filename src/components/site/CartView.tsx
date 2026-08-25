"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, ShieldCheck, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";

export function CartView() {
  const { lines, subtotal, discount, total, remove, hydrated } = useCart();

  return (
    <main className="pt-28">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">YOUR CART</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {hydrated
            ? `${lines.length} ${lines.length === 1 ? "asset" : "assets"} ready for instant download.`
            : "Loading your cart…"}
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            {hydrated && lines.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-14 text-center">
                <p className="font-display text-xl font-bold">YOUR CART IS EMPTY</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse the library and add a few production-ready assets.
                </p>
                <Link
                  href="/models"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  EXPLORE MODELS <ArrowRight className="size-4" />
                </Link>
              </div>
            )}

            {lines.map((p) => (
              <div
                key={p.slug}
                className="flex items-center gap-5 rounded-2xl border border-border bg-card p-4"
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
                  <Image src={p.image} alt={p.name} fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/models/${p.slug}`} className="font-display text-base font-bold">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.category} • {p.formats.join(" / ")}
                  </p>
                  <p className="mt-1.5 font-display text-lg font-bold">{formatPrice(p.price)}</p>
                </div>
                <button
                  onClick={() => remove(p.slug)}
                  aria-label={`Remove ${p.name}`}
                  className="flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-7">
            <h2 className="font-display text-lg font-bold">ORDER SUMMARY</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="text-lime">-{formatPrice(discount)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-display text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_18px_50px_-18px_var(--primary)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              PROCEED TO CHECKOUT <ArrowRight className="size-4" />
            </Link>
            <div className="mt-6 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-lime" /> Secure digital purchase
              </p>
              <p className="flex items-center gap-2">
                <Download className="size-4 text-cyan" /> Instant delivery after payment
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
