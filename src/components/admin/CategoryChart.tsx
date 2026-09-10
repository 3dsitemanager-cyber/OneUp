"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

type Row = DashboardStats["categorySplit"][number];

/**
 * Revenue by catalogue category. Categories are *nominal* — swapping their order
 * changes nothing — so every bar wears the same slot-1 hue rather than a value
 * ramp, which would re-encode length as colour. The leader is emphasised.
 */
export function CategoryChart({ rows }: { rows: Row[] }) {
  const data = rows.slice(0, 6);
  const total = data.reduce((sum, r) => sum + r.revenue, 0);
  // Headroom for the end labels, so the widest bar never collides with its value.
  const axisMax = Math.max(...data.map((r) => r.revenue), 0) * 1.18 || 1;

  if (total === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <Header />
        <p className="mt-8 rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          No sales yet. Category revenue builds up as orders come in.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <Header subtitle={`${formatPrice(total)} across ${data.length} categories`} />

      {/* Height covers the plot plus the x-axis band so nothing scrolls inside. */}
      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" strokeWidth={1} horizontal={false} />
            {/* Domain padded ~18% so the widest bar leaves room for its end label. */}
            <XAxis type="number" domain={[0, axisMax]} hide />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              width={104}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            />
            <Tooltip cursor={{ fill: "var(--muted)" }} content={<CategoryTooltip />} />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
              {data.map((row, i) => (
                <Cell
                  key={row.category}
                  // Emphasis: the leader carries the accent, the rest recede.
                  fill={i === 0 ? "var(--chart-1)" : "var(--chart-seq-100)"}
                />
              ))}
              {/* Direct labels ride the bar ends; text wears ink, never the series hue. */}
              <LabelList
                dataKey="revenue"
                position="right"
                offset={10}
                formatter={(v: number) => formatPrice(v)}
                style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Header({ subtitle }: { subtitle?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="font-display text-lg font-bold">REVENUE BY CATEGORY</h2>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {subtitle ?? "Summed across every line item sold."}
      </p>
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
      <p className="font-display text-lg font-bold">{formatPrice(row.revenue)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {row.category} · {row.units} {row.units === 1 ? "unit" : "units"} sold
      </p>
    </div>
  );
}
