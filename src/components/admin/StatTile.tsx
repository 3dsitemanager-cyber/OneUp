import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import type { TrendDelta } from "@/lib/types";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Optional 30-day comparison. Omit for measures with no meaningful baseline. */
  trend?: TrendDelta;
  /** For most measures up is good; set false where a rise is bad. */
  upIsGood?: boolean;
  /** Sparkline values, oldest first — rendered only when there is variation. */
  spark?: number[];
};

/**
 * A headline number. Per the dataviz form heuristic a single current value is a
 * stat tile, never a one-bar chart — the sparkline is context, not the subject.
 */
export function StatTile({ icon: Icon, label, value, trend, upIsGood = true, spark }: Props) {
  const pct = trend?.changePct ?? null;
  const flat = pct === null || pct === 0;
  const good = pct !== null && (pct > 0) === upIsGood;
  const Arrow = flat ? Minus : pct! > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_var(--brand-blue)]">
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "var(--gradient-nav)" }}
        >
          <Icon className="size-4" />
        </span>
        <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground">{label}</p>
      </div>

      {/* Proportional figures: tabular-nums makes a large standalone number look loose. */}
      <p className="mt-3 font-display text-3xl font-bold text-brand">{value}</p>

      <div className="mt-2 flex items-center justify-between gap-3">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              flat ? "text-muted-foreground" : good ? "text-lime" : "text-destructive"
            }`}
          >
            <Arrow className="size-3.5" aria-hidden />
            {pct === null ? "No prior data" : `${pct > 0 ? "+" : ""}${pct}% vs prev 30d`}
          </span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </div>
    </div>
  );
}

/** 12-point trend shape. Deliberately unlabelled — the tile's value is the number. */
function Sparkline({ values }: { values: number[] }) {
  const w = 64;
  const h = 20;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
