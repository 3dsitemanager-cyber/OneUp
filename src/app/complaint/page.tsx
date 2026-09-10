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

// See the note on the homepage: cached for a minute, not per request.
export const revalidate = 60;

const guides = [
  ["DOWNLOAD ISSUES", "Expired links are re-issued automatically from your order page."],
  ["CORRUPTED FILES", "We re-package and verify the archive, then send a fresh link."],
  ["PAYMENT PROBLEMS", "Charges that don't produce an order are refunded in full."],
];

export default async function ComplaintPage() {
  // Only the names reach the form's dropdown, so don't fetch whole documents.
  const products = await getProducts({ listOnly: true });

  return (
    <main className="pt-24">
      <section className="relative border-b border-border">
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-primary">
            <LifeBuoy className="size-3" /> SUPPORT
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            NEED HELP WITH AN ORDER?
          </h1>
          <p className="mt-1.5 max-w-xl text-xs text-muted-foreground">
            Tell us what went wrong and our support team will review your request.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <ComplaintForm productNames={products.map((p) => p.name)} />

        <aside className="h-fit space-y-3 lg:sticky lg:top-24">
          {guides.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-display text-xs font-bold tracking-wide">{t}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </aside>
      </section>
    </main>
  );
}
