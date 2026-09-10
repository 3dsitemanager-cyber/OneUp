"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

type Point = DashboardStats["revenueSeries"][number];

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
] as const;

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Round a max up to a clean axis ceiling so ticks land on readable numbers. */
function niceMax(value: number) {
  if (value <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / mag) * mag;
}

export function RevenueChart({ series }: { series: Point[] }) {
  const [days, setDays] = useState<number>(30);
  const [showTable, setShowTable] = useState(false);

  const data = series.slice(-days);
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const orders = data.reduce((sum, d) => sum + d.orders, 0);
  const max = niceMax(Math.max(...data.map((d) => d.revenue), 0));
  const empty = total === 0;

  // A line needs two points to be visible. When trading days are sparse (a new
  // store, or a short range), show the marks themselves so the data isn't a
  // blank plot — the area alone would render as nothing.
  const tradingDays = data.filter((d) => d.orders > 0).length;
  const sparse = tradingDays <= 2;

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-primary" />
            {/* Single series — the title names it, so no legend box. */}
            <h2 className="font-display text-lg font-bold">REVENUE — LAST {days} DAYS</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatPrice(total)} from {orders} {orders === 1 ? "order" : "orders"} · excludes
            refunds
            {!empty && sparse && (
              <>
                {" "}
                · all on {tradingDays === 1 ? "a single day" : `${tradingDays} days`} so far
              </>
            )}
          </p>
        </div>

        {/* Filters sit in one row above the plot, never inside it. */}
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
                days === r.days
                  ? "border-brand bg-brand text-white"
                  : "border-border text-foreground hover:border-brand"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="rounded-full border-2 border-border px-4 py-1.5 text-xs font-bold transition-colors hover:border-brand"
          >
            {showTable ? "CHART" : "TABLE"}
          </button>
        </div>
      </header>

      {empty ? (
        <p className="mt-8 rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          No paid orders in this window yet. Completed checkouts appear here the same day.
        </p>
      ) : showTable ? (
        <TableView data={data} />
      ) : (
        <div className="mt-6 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {/* Hairline, solid, recessive — never dashed. */}
              <CartesianGrid
                stroke="var(--chart-grid)"
                strokeWidth={1}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tickLine={false}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                domain={[0, max]}
                tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`}
                tickLine={false}
                axisLine={false}
                width={68}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
                content={<RevenueTooltip />}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#revenueFill)"
                // A dashboard should render its value immediately; the grow-in
                // animation also leaves the path at baseline if it never runs.
                isAnimationActive={false}
                // >=8px markers, each with a 2px surface ring so they stay legible.
                dot={
                  sparse
                    ? (props: { cx?: number; cy?: number; payload?: Point }) =>
                        props.payload && props.payload.orders > 0 ? (
                          <circle
                            key={props.payload.date}
                            cx={props.cx}
                            cy={props.cy}
                            r={4}
                            fill="var(--chart-1)"
                            stroke="var(--card)"
                            strokeWidth={2}
                          />
                        ) : (
                          <g key={props.payload?.date} />
                        )
                    : false
                }
                activeDot={{
                  r: 5,
                  fill: "var(--chart-1)",
                  stroke: "var(--card)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
      {/* Value leads, label follows — the reader already knows the series. */}
      <p className="font-display text-lg font-bold">{formatPrice(point.revenue)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {point.orders} {point.orders === 1 ? "order" : "orders"} · {shortDate(point.date)}
      </p>
    </div>
  );
}

/** The table twin — every value stays reachable without hovering. */
function TableView({ data }: { data: Point[] }) {
  const rows = [...data].reverse().filter((d) => d.orders > 0);

  return (
    <div className="mt-6 max-h-[280px] overflow-y-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 border-b border-border bg-card text-[11px] tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-bold">DATE</th>
            <th className="px-4 py-3 text-right font-bold">ORDERS</th>
            <th className="px-4 py-3 text-right font-bold">REVENUE</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((d) => (
            <tr key={d.date} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-2.5">{shortDate(d.date)}</td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{d.orders}</td>
              <td className="px-4 py-2.5 text-right">{formatPrice(d.revenue)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                No orders in this window.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
