import type { Metadata } from "next";
import { DollarSign, Download, Package, Receipt } from "lucide-react";
import { getDashboardStats } from "@/server/queries";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin Dashboard — OneUp Gaming",
  description: "Revenue, sales and asset performance overview for the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const max = stats.topAssets[0]?.value || 1;

  const tiles = [
    { icon: DollarSign, label: "REVENUE", value: formatPrice(stats.revenue) },
    { icon: Download, label: "DOWNLOADS", value: stats.downloads.toLocaleString("en-US") },
    { icon: Package, label: "LIVE ASSETS", value: String(stats.liveAssets) },
    { icon: Receipt, label: "ORDERS", value: String(stats.orderCount) },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl font-bold">DASHBOARD</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Live marketplace performance, read straight from MongoDB Atlas.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_var(--brand-blue)]"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: "var(--gradient-nav)" }}
              >
                <s.icon className="size-4" />
              </span>
              <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground">
                {s.label}
              </p>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-brand">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-primary" />
          <h2 className="font-display text-lg font-bold">TOP EARNING ASSETS</h2>
        </div>
        {stats.topAssets.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No assets yet. Run{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">npm run seed</code> to load the
            starter catalogue.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {stats.topAssets.map((p, i) => (
              <li key={p.slug} className="flex items-center gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-display text-sm font-bold text-brand">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-bold">{p.name}</span>
                    <span className="shrink-0 font-display font-bold text-primary">
                      {formatPrice(p.value)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.round((p.value / max) * 100)}%`,
                        background: "var(--gradient-nav)",
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
