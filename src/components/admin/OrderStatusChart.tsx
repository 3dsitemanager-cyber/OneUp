"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

type Row = DashboardStats["statusSplit"][number];
type Payment = DashboardStats["paymentSplit"][number];

/**
 * Order status is a *state*, not a series identity, so it wears reserved status
 * colours rather than categorical slots. Each segment carries a visible label,
 * so colour never encodes alone.
 */
const STATUS_STYLE: Record<Row["status"], { fill: string; text: string }> = {
  Pending: { fill: "var(--chart-4)", text: "text-[color:var(--chart-4)]" },
  Paid: { fill: "var(--chart-1)", text: "text-brand" },
  Delivered: { fill: "var(--chart-6)", text: "text-lime" },
  Refunded: { fill: "var(--chart-2)", text: "text-destructive" },
};

const PAYMENT_LABEL: Record<string, string> = {
  card: "Card",
  wallet: "Wallet",
  bank: "Bank",
};

export function OrderStatusChart({
  rows,
  payments,
}: {
  rows: Row[];
  payments: Payment[];
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="font-display text-lg font-bold">ORDER FULFILMENT</h2>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {total} {total === 1 ? "order" : "orders"} by status
      </p>

      {total === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          No orders yet. Statuses appear once a checkout completes.
        </p>
      ) : (
        <>
          {/* Part-to-whole: a stacked bar, with a 2px surface gap doing the separating. */}
          <div className="mt-6 flex h-3 gap-[2px] overflow-hidden rounded-full">
            {rows
              .filter((r) => r.count > 0)
              .map((r) => (
                <div
                  key={r.status}
                  style={{
                    width: `${(r.count / total) * 100}%`,
                    background: STATUS_STYLE[r.status].fill,
                  }}
                  title={`${r.status}: ${r.count}`}
                />
              ))}
          </div>

          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.status} className="flex items-center gap-3 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: STATUS_STYLE[r.status].fill }}
                  aria-hidden
                />
                <Link
                  href="/admin/orders"
                  className="min-w-0 flex-1 truncate font-semibold hover:text-brand"
                >
                  {r.status}
                </Link>
                <span className="tabular-nums text-muted-foreground">
                  {total > 0 ? Math.round((r.count / total) * 100) : 0}%
                </span>
                <span className="w-12 text-right tabular-nums font-semibold">{r.count}</span>
                <span className="w-24 text-right tabular-nums text-muted-foreground">
                  {formatPrice(r.total)}
                </span>
              </li>
            ))}
          </ul>

          {payments.length > 0 && (
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground">
                PAYMENT METHOD
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {payments.map((p) => (
                  <li
                    key={p.method}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold"
                  >
                    {PAYMENT_LABEL[p.method] ?? p.method}
                    <span className="ml-1.5 tabular-nums text-muted-foreground">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
