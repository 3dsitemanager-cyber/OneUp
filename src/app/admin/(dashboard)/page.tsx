import type { Metadata } from "next";
import Link from "next/link";
import {
  DollarSign,
  Download,
  LifeBuoy,
  Mail,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import { getDashboardStats } from "@/server/queries";
import { formatPrice } from "@/lib/format";
import { StatTile } from "@/components/admin/StatTile";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { CategoryChart } from "@/components/admin/CategoryChart";
import { OrderStatusChart } from "@/components/admin/OrderStatusChart";

export const metadata: Metadata = {
  title: "Admin Dashboard — OneUp Gaming",
  description: "Revenue, sales and asset performance overview for the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const max = stats.topAssets[0]?.value || 1;

  // The sparkline shows shape, so it takes the tail of the same 30-day series.
  const spark = stats.revenueSeries.slice(-12).map((d) => d.revenue);

  const tiles = [
    {
      icon: DollarSign,
      label: "REVENUE",
      value: formatPrice(stats.revenue),
      trend: stats.trends.revenue,
      spark,
    },
    {
      icon: Receipt,
      label: "ORDERS",
      value: stats.orderCount.toLocaleString("en-US"),
      trend: stats.trends.orders,
    },
    {
      icon: ShoppingCart,
      label: "AVG ORDER",
      value: formatPrice(stats.trends.avgOrderValue.current),
      trend: stats.trends.avgOrderValue,
    },
    {
      icon: Users,
      label: "BUYERS (30D)",
      value: stats.trends.customers.current.toLocaleString("en-US"),
      trend: stats.trends.customers,
    },
    {
      icon: Download,
      label: "DOWNLOADS",
      value: stats.downloads.toLocaleString("en-US"),
    },
    {
      icon: Package,
      label: "LIVE ASSETS",
      value: String(stats.liveAssets),
    },
  ];

  const inbox = [
    {
      icon: Mail,
      label: "MESSAGES",
      href: "/admin/messages",
      count: stats.unreadMessages,
      pending: "unread messages waiting for a reply",
      empty: "No unread messages.",
    },
    {
      icon: LifeBuoy,
      label: "SUPPORT",
      href: "/admin/complaints",
      count: stats.openComplaints,
      pending: "tickets still open or in review",
      empty: "No open tickets.",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl font-bold">DASHBOARD</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Live marketplace performance, read straight from MongoDB Atlas.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((s) => (
          <StatTile
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            {...(s.trend ? { trend: s.trend } : {})}
            {...(s.spark ? { spark: s.spark } : {})}
          />
        ))}
      </div>

      <RevenueChart series={stats.revenueSeries} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryChart rows={stats.categorySplit} />
        <OrderStatusChart rows={stats.statusSplit} payments={stats.paymentSplit} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {inbox.map((i) => (
          <Link
            key={i.label}
            href={i.href}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
              <i.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground">
                {i.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {i.count > 0 ? i.pending : i.empty}
              </p>
            </div>
            {i.count > 0 && (
              <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-display text-sm font-bold text-primary">
                {i.count}
              </span>
            )}
          </Link>
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
