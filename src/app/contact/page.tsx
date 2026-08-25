import type { Metadata } from "next";
import Image from "next/image";
import { Briefcase, LifeBuoy, Mail } from "lucide-react";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact OneUp Gaming — Talk To The 3D Asset Team",
  description: "Reach the OneUp Gaming team for support, custom asset requests and partnerships.",
  openGraph: {
    title: "Contact OneUp Gaming",
    description: "Support, custom work and partnership enquiries.",
  },
};

const channels = [
  { icon: Mail, title: "EMAIL", value: "hello@oneupgaming.studio" },
  { icon: LifeBuoy, title: "SUPPORT", value: "support@oneupgaming.studio" },
  { icon: Briefcase, title: "BUSINESS", value: "partners@oneupgaming.studio" },
];

export default function ContactPage() {
  return (
    <main className="pt-28">
      <section className="relative">
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">LET&apos;S TALK</h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Questions about licensing, custom asset commissions or studio bundles? Our team answers
              every message personally.
            </p>
            <div className="mt-8 space-y-4">
              {channels.map((c) => (
                <div
                  key={c.title}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-primary">
                    <c.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] tracking-[0.16em] text-muted-foreground">{c.title}</p>
                    <p className="font-display text-sm font-bold">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-8 hidden aspect-[7/5] overflow-hidden rounded-2xl border border-border lg:block">
              <Image
                src="/assets/hero-3d.jpg"
                alt="3D asset composition"
                fill
                sizes="50vw"
                className="object-cover"
              />
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}
