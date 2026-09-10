import type { Metadata } from "next";
import { getCustomers } from "@/server/queries";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Customers — OneUp Gaming Admin",
  description: "Studio and creator accounts buying 3D assets on the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl font-bold">CUSTOMERS</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {customers.length} {customers.length === 1 ? "account" : "accounts"} across studios and
          independent creators.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {customers.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface font-display text-sm font-bold text-primary">
                {initials(c.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.email}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-xl border border-border bg-surface px-2 py-3">
                <dt className="text-muted-foreground">Orders</dt>
                <dd className="mt-1 font-display text-sm font-bold">{c.orders}</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface px-2 py-3">
                <dt className="text-muted-foreground">Spend</dt>
                <dd className="mt-1 font-display text-sm font-bold">{formatPrice(c.spend)}</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface px-2 py-3">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="mt-1 font-display text-sm font-bold">{c.plan}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-14 text-center">
          <p className="font-display text-xl font-bold">NO CUSTOMERS YET</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Customer records are created automatically on the first completed checkout.
          </p>
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
