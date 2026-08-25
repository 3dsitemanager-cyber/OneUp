import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories } from "@/server/queries";
import { SectionHeading } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Asset Categories — OneUp Gaming 3D Marketplace",
  description:
    "Browse 3D asset categories: characters, weapons, vehicles, environments, props and creatures.",
  openGraph: {
    title: "Asset Categories — OneUp Gaming",
    description: "Find game-ready 3D assets by category.",
  },
};

export const revalidate = 0;

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <main className="pt-28">
      <section className="relative border-b border-border">
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">ASSET CATEGORIES</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Six curated collections covering everything from hero characters to full modular
            environments.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/models?category=${encodeURIComponent(c.name)}`}
              className="group relative block overflow-hidden rounded-2xl border border-border"
            >
              <div className="relative h-64 w-full bg-muted">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    {c.name.toUpperCase()}
                  </h2>
                  <p className="text-xs text-white/80">{c.count} assets</p>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-primary">
                  EXPLORE <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-14 text-center">
            <p className="font-display text-xl font-bold">NO CATEGORIES YET</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <code className="rounded bg-surface px-1.5 py-0.5">npm run seed</code> to populate
              the database.
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-border bg-surface/50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="COLLECTIONS"
              title="COMPLETE WORLD KITS"
              subtitle="Bundle characters, props and environments that share a consistent art direction — so your scenes look intentional, not stitched together."
            />
            <Link
              href="/models"
              className="mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              BROWSE LIBRARY <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative aspect-[7/5] overflow-hidden rounded-3xl border border-border">
            <Image
              src="/assets/hero-3d.jpg"
              alt="Layered 3D asset collection"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
