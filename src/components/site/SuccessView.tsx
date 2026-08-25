"use client";

import Link from "next/link";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

const PREPARE_SECONDS = 60;

export function SuccessView({ order }: { order: Order | null }) {
  const [seconds, setSeconds] = useState(PREPARE_SECONDS);

  useEffect(() => {
    if (seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const productNames = order?.items.length
    ? order.items.map((i) => i.name).join(", ")
    : "3D Asset Order";

  return (
    <main className="pt-28">
      <section className="relative">
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full border border-border bg-card text-lime shadow-[0_0_60px_-16px_var(--lime)]">
            <CheckCircle2 className="size-10" />
          </span>
          <h1 className="mt-7 font-display text-4xl font-bold sm:text-5xl">PAYMENT SUCCESSFUL</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {order
              ? "Your order has been confirmed and saved to your account."
              : "Your order has been confirmed."}
          </p>

          <dl className="mx-auto mt-9 grid gap-4 rounded-2xl border border-border bg-card p-7 text-left sm:grid-cols-3">
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted-foreground">ORDER ID</dt>
              <dd className="mt-1 font-display font-bold">{order?.orderId ?? "—"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] tracking-[0.14em] text-muted-foreground">PRODUCT</dt>
              <dd className="mt-1 truncate font-display font-bold">{productNames}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted-foreground">AMOUNT PAID</dt>
              <dd className="mt-1 font-display font-bold">{formatPrice(order?.total ?? 0)}</dd>
            </div>
          </dl>

          <div className="mt-8 rounded-2xl border border-border bg-surface p-9">
            <h2 className="font-display text-lg font-bold">YOUR DOWNLOAD IS BEING PREPARED</h2>
            {seconds > 0 ? (
              <>
                <p className="mt-6 font-display text-6xl font-bold tabular-nums text-gradient">
                  {mm}:{ss}
                </p>
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Preparing your secure download...
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 text-sm text-muted-foreground">
                  Your authorised download link is ready. It expires after a short period for
                  security.
                </p>
                <button
                  onClick={() =>
                    toast.info(
                      "Secure downloads activate once file storage is connected — links are issued server-side after payment verification.",
                    )
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_18px_50px_-18px_var(--primary)]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  DOWNLOAD YOUR MODEL <Download className="size-4" />
                </button>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/models"
              className="rounded-xl border border-border px-6 py-3.5 text-sm font-bold tracking-wide hover:bg-secondary"
            >
              CONTINUE BROWSING
            </Link>
            <Link
              href="/complaint"
              className="rounded-xl border border-border px-6 py-3.5 text-sm font-bold tracking-wide hover:bg-secondary"
            >
              NEED HELP?
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
