"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";

const countries = ["Pakistan", "United States", "United Kingdom", "Germany", "Japan"];
const methods = [
  { id: "card", label: "Card" },
  { id: "wallet", label: "Wallet" },
  { id: "bank", label: "Bank" },
] as const;

export function CheckoutForm() {
  const { lines, subtotal, discount, total, clear, hydrated } = useCart();
  const router = useRouter();

  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("card");
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
      // The server re-prices every line from MongoDB — this payload is a request,
      // not the source of truth for what gets charged.
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod: method,
          items: lines.map((l) => ({
            slug: l.slug,
            name: l.name,
            category: l.category,
            image: l.image,
            price: l.price,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "We couldn't place that order. Please try again.");
        return;
      }

      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(json.data.orderId)}`);
    } catch {
      toast.error("Network error — check your connection and try again.");
    } finally {
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
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      method === m.id
                        ? "border-primary bg-primary/10"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {method === "card" ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Card Number" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <Field label="Expiry" placeholder="MM / YY" />
                  <Field label="CVC" placeholder="•••" />
                </div>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">
                  You&apos;ll be redirected to the provider to authorise this payment securely.
                </p>
              )}
              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-lime" /> Card details are never sent to our
                server — connect a payment provider before going live.
              </p>
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
                  <Loader2 className="size-4 animate-spin" /> PLACING ORDER…
                </>
              ) : (
                <>
                  <CreditCard className="size-4" /> PAY {formatPrice(total)}
                </>
              )}
            </button>
          </aside>
        </form>
      </section>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
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
