"use client";

import Image from "next/image";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";

const countries = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Sweden",
  "Poland",
  "United Arab Emirates",
  "Saudi Arabia",
  "India",
  "Bangladesh",
  "Singapore",
  "Japan",
  "South Korea",
  "China",
  "Brazil",
  "Mexico",
  "South Africa",
  "Nigeria",
  "Turkey",
  "Other",
];
export function CheckoutForm() {
  const { lines, subtotal, discount, total, hydrated } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customerName: "", email: "", country: countries[0]! });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (lines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      // Only slugs are sent: the server re-prices every line from MongoDB, so
      // nothing the browser claims about price can reach Stripe.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, slugs: lines.map((l) => l.slug) }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "We couldn't start that payment. Please try again.");
        return;
      }

      // The cart is deliberately left alone until payment succeeds — the buyer
      // may come back from Stripe having cancelled.
      window.location.href = json.data.url as string;
    } catch {
      toast.error("Network error — check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="pt-28">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">CHECKOUT</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Digital delivery — no shipping details required.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-7">
              <h2 className="font-display text-lg font-bold">CUSTOMER INFORMATION</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full Name"
                  placeholder="Alex Mercer"
                  required
                  value={form.customerName}
                  onChange={(v) => setForm((f) => ({ ...f, customerName: v }))}
                />
                <Field
                  label="Email"
                  type="email"
                  placeholder="alex@studio.com"
                  required
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                />
                <div className="sm:col-span-2">
                  <Label>Country</Label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                  >
                    {countries.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Lock className="size-4 text-lime" /> SECURE PAYMENT
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                You&apos;ll be taken to Stripe&apos;s secure payment page to complete your purchase,
                then brought straight back here for your downloads.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  "Card details are entered on Stripe — never on our servers",
                  "Cards, Apple Pay and Google Pay all supported",
                  "Your download links are issued the moment payment clears",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lime" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-7">
            <h2 className="font-display text-lg font-bold">ORDER SUMMARY</h2>
            <ul className="mt-5 space-y-3">
              {lines.map((p) => (
                <li key={p.slug} className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                    <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <span className="text-sm">{formatPrice(p.price)}</span>
                </li>
              ))}
              {hydrated && lines.length === 0 && (
                <li className="text-sm text-muted-foreground">No items in your cart yet.</li>
              )}
            </ul>
            <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
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
            <button
              type="submit"
              disabled={submitting || lines.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_18px_50px_-18px_var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> REDIRECTING TO STRIPE…
                </>
              ) : (
                <>
                  <CreditCard className="size-4" /> PAY {formatPrice(total)}
                </>
              )}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Payments processed securely by Stripe.
            </p>
          </aside>
        </form>
      </section>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[11px] font-bold tracking-[0.14em] text-foreground">
      {String(children).toUpperCase()}
    </span>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        {...(onChange ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : {})}
        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
      />
    </label>
  );
}
