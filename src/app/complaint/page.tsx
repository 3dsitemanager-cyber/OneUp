import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { getProducts } from "@/server/queries";
import { ComplaintForm } from "@/components/site/ComplaintForm";

export const metadata: Metadata = {
  title: "Order Support & Complaints — OneUp Gaming",
  description:
    "Report a download problem, corrupted file, payment or license issue with your OneUp Gaming order.",
  openGraph: {
    title: "Order Support — OneUp Gaming",
    description: "Our team reviews order issues within 24–48 hours.",
  },
};

export const revalidate = 0;

const guides = [
  ["DOWNLOAD ISSUES", "Expired links are re-issued automatically from your order page."],
  ["CORRUPTED FILES", "We re-package and verify the archive, then send a fresh link."],
  ["PAYMENT PROBLEMS", "Charges that don't produce an order are refunded in full."],
];

export default async function ComplaintPage() {
  const products = await getProducts();

  return (
    <main className="pt-28">
      <section className="relative border-b border-border">
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-primary">
            <LifeBuoy className="size-3.5" /> SUPPORT
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            NEED HELP WITH AN ORDER?
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Tell us what went wrong and our support team will review your request.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <ComplaintForm productNames={products.map((p) => p.name)} />

        <aside className="h-fit space-y-4">
          {guides.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-sm font-bold tracking-wide">{t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </aside>
      </section>
    </main>
  );
}
