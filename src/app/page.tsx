import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, Download, Gamepad2, Layers, ShieldCheck } from "lucide-react";

import { getCategories, getProducts } from "@/server/queries";
import { ProductCard } from "@/components/site/ProductCard";
import { FeaturedGrid } from "@/components/site/FeaturedGrid";
import { Badge, SectionHeading } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "OneUp Gaming — Premium 3D Game Assets & Models Marketplace",
  description:
    "Buy premium game-ready 3D models: characters, weapons, vehicles, environments and props. 4K PBR textures, FBX/BLEND/OBJ, instant download.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "OneUp Gaming — Premium 3D Game Assets Marketplace",
    description: "Production-ready 3D assets for modern games. Instant digital delivery.",
  },
};

// Cached for a minute: the storefront is read far more often than the
// catalogue changes, so most visitors get HTML without touching the database.
// An admin edit appears within 60s rather than instantly — the trade for not
// re-querying Atlas on every page view.
export const revalidate = 60;

export default async function HomePage() {
  // Only categories that actually have listings — an empty tile leads nowhere.
  //
  // Bounded and card-shaped rather than the whole catalogue. The bound is
  // generous because FeaturedGrid filters these by category in the browser: too
  // low and a category tab would look empty while /models still lists the
  // items. If the catalogue outgrows this, that tab filter should move server-
  // side rather than the number creeping up.
  const [products, justDropped, categories] = await Promise.all([
    getProducts({ listOnly: true, limit: 48 }),
    getProducts({ sort: "Newest", listOnly: true, limit: 4 }),
    getCategories({ onlyWithProducts: true }),
  ]);

  return (
    <main className="overflow-hidden">
      {/* HERO */}
      <section className="relative w-full pt-[76px]">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <Image
            src="/assets/hero-3d.jpg"
            alt="Premium stylized 3D game characters, vehicles and houses"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* FEATURED */}
      <section className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <SectionHeading
          eyebrow="MARKETPLACE"
          title="FEATURED ASSETS"
          subtitle="Production-ready 3D models built for modern game development."
          action={
            <Link
              href="/models"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-xs font-bold tracking-wide transition-colors hover:border-brand hover:text-brand"
            >
              VIEW ALL MODELS <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <FeaturedGrid products={products} categories={categories} />
      </section>

      {/* SHOWCASE */}
      <section className="relative border-y border-border">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2">
          <div>
            <Badge>
              <Layers className="size-3.5 text-brand" /> FULL PIPELINE READY
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
              CREATE WITHOUT LIMITS
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              From characters to complete environments, find the assets you need to turn your ideas
              into playable worlds.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
              {["4K TEXTURES", "PBR MATERIALS", "GAME READY", "OPTIMIZED MESH"].map((m) => (
                <div
                  key={m}
                  className="rounded-xl border-2 border-border px-4 py-3 transition-colors hover:border-brand"
                >
                  <p className="font-display text-sm font-bold">{m}</p>
                </div>
              ))}
            </div>
            <Link
              href="/models"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_var(--primary)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              EXPLORE ALL ASSETS <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-[0_24px_60px_-28px_rgba(11,24,54,0.7)]">
            <Image
              src="/assets/monster.jpg"
              alt="Game-ready monster truck 3D asset"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <SectionHeading
          eyebrow="WHY ONEUP GAMING"
          title="BUILT FOR CREATORS"
          subtitle="Every asset passes a technical review before it reaches the store."
        />
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Gamepad2,
              title: "GAME READY",
              text: "Optimized assets prepared for real production workflows.",
            },
            {
              icon: Boxes,
              title: "HIGH QUALITY",
              text: "Detailed geometry and high-resolution textures.",
            },
            {
              icon: Layers,
              title: "MULTIPLE FORMATS",
              text: "Compatible with popular 3D software and game engines.",
            },
            {
              icon: Download,
              title: "INSTANT DELIVERY",
              text: "Access purchased assets immediately after successful payment.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border-2 border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand hover:shadow-[0_20px_44px_-26px_var(--brand-blue)]"
            >
              <span
                className="flex size-12 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--gradient-nav)" }}
              >
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <SectionHeading eyebrow="BROWSE" title="ASSET CATEGORIES" />
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/models?category=${encodeURIComponent(c.name)}`}
              className="group relative block overflow-hidden rounded-2xl border-2 border-border transition-all hover:-translate-y-1 hover:border-brand"
            >
              <div className="relative h-52 w-full bg-muted">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                    {c.name.toUpperCase()}
                  </h3>
                  <p className="text-xs font-semibold text-white/90">{c.count} assets</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-primary">
                  EXPLORE <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* JUST DROPPED */}
      <section className="border-y border-border">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <SectionHeading
            eyebrow="LATEST"
            title="JUST DROPPED"
            subtitle="The newest additions to the library."
            action={
              <Link
                href="/models"
                className="inline-flex items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-xs font-bold tracking-wide transition-colors hover:border-brand hover:text-brand"
              >
                VIEW ALL MODELS <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {justDropped.map((p) => (
              <ProductCard key={`new-${p.slug}`} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="grid gap-6 rounded-3xl border-2 border-border p-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["500+", "3D Assets"],
            ["10K+", "Creators"],
            ["25K+", "Downloads"],
            ["4.9/5", "Average Rating"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-4xl font-bold text-brand sm:text-5xl">{value}</p>
              <p className="mt-1 text-xs font-bold tracking-[0.16em] text-foreground">
                {label!.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <div
          className="overflow-hidden rounded-3xl px-8 py-6 text-center sm:px-16"
          style={{ background: "var(--gradient-primary)" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-white ring-1 ring-white/40">
            <ShieldCheck className="size-3.5" /> SECURE DIGITAL PURCHASE
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:text-4xl">
            READY TO BUILD YOUR NEXT WORLD?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-white sm:text-base">
            Get production-ready 3D assets and spend less time creating from scratch.
          </p>
          <Link
            href="/models"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold tracking-wide text-primary shadow-[0_14px_34px_-14px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5"
          >
            START EXPLORING <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
