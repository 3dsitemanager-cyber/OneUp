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
    <main className="pt-24">
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">LET&apos;S TALK</h1>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
              Questions about licensing, custom asset commissions or studio bundles? Our team answers
              every message personally.
            </p>
            <div className="mt-5 space-y-2.5">
              {channels.map((c) => (
                <div
                  key={c.title}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary">
                    <c.icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.16em] text-muted-foreground">{c.title}</p>
                    <p className="truncate font-display text-xs font-bold">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-5 hidden aspect-[4/3] overflow-hidden rounded-xl border border-border lg:block">
              <Image
                src="/assets/monster-surf.jpg"
                alt="Stylised monster truck 3D asset"
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
