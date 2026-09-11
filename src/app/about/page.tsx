import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "About OneUp Gaming — Premium 3D Asset Studio & Marketplace",
  description:
    "OneUp Gaming builds and curates production-ready 3D game assets for studios and independent creators.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About OneUp Gaming",
    description: "The studio behind the OneUp Gaming 3D asset library.",
  },
};

const faqs = [
  {
    q: "What do I get after purchase?",
    a: "A secure, time-limited download link to the asset archive containing all listed formats, textures and documentation.",
  },
  {
    q: "Can I use assets in commercial games?",
    a: "Yes. Every asset ships with a standard commercial license covering unlimited personal and commercial projects.",
  },
  {
    q: "Do you offer refunds?",
    a: "Digital assets are refundable within 14 days if the files are corrupted or materially different from the listing.",
  },
  {
    q: "Which engines are supported?",
    a: "Assets are tested in Unity and Unreal Engine, and are provided in Blender-native and interchange formats.",
  },
];

export default function AboutPage() {
  return (
    <main className="pt-28">
      <section className="relative border-b border-border">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              A STUDIO-GRADE ASSET LIBRARY
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              OneUp Gaming started as an internal asset pipeline for a small game studio. Every model here
              was built to ship inside a real production, then reviewed for topology, UVs, texture
              budget and engine import before it reached the store.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                ["500+", "Assets"],
                ["10K+", "Creators"],
                ["4.9/5", "Rating"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-display text-2xl font-bold text-gradient">{v}</p>
                  <p className="mt-1 text-[11px] tracking-[0.14em] text-muted-foreground">
                    {l!.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[7/5] overflow-hidden rounded-3xl border border-border">
            <Image
              src="/assets/hero-3d.jpg"
              alt="OneUp Gaming 3D asset showcase"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <SectionHeading eyebrow="FAQ" title="COMMON QUESTIONS" />
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-7">
              <h3 className="font-display text-base font-bold">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            CONTACT US <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/complaint"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-bold tracking-wide hover:bg-secondary"
          >
            ORDER SUPPORT
          </Link>
        </div>
      </section>
    </main>
  );
}
