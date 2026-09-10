"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { formatBytes } from "@/lib/upload-policy";
import { useCart } from "@/lib/cart";
import type { Order } from "@/lib/types";

/** Seconds shown before the download buttons appear. */
const PREPARE_SECONDS = 10;

/** Only counts down once per order, so returning to the page doesn't restart it. */
const seenKey = (orderId: string) => `oneupgaming-prepared-${orderId}`;

type DownloadFile = {
  slug: string;
  name: string;
  image: string;
  available: boolean;
  sizeBytes: number;
  format: string;
};

export function SuccessView({
  order: initialOrder,
  downloadToken: initialToken,
  pending = false,
}: {
  order: Order | null;
  downloadToken: string | null;
  pending?: boolean;
}) {
  // The webhook may still be in flight when Stripe redirects the buyer back, so
  // both of these can arrive from polling rather than from the server render.
  const [order, setOrder] = useState(initialOrder);
  const [downloadToken, setDownloadToken] = useState(initialToken);
  const [waiting, setWaiting] = useState(pending);

  const [files, setFiles] = useState<DownloadFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(PREPARE_SECONDS);
  const { clear } = useCart();

  // Payment is confirmed by this point, so the cart has served its purpose.
  // Deliberately not cleared before redirecting to Stripe: a cancelled payment
  // should leave the buyer's cart intact.
  useEffect(() => {
    if (order) clear();
  }, [order, clear]);

  // Poll until the webhook lands. Gives up after ~30s rather than spinning
  // forever; the order still exists and is reachable from /downloads.
  useEffect(() => {
    if (!waiting) return;

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setWaiting(false);
      return;
    }

    let alive = true;
    let attempts = 0;

    const poll = async () => {
      if (!alive) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
        const json = await res.json();
        if (!alive) return;

        if (res.ok && json.ok && json.data.status === "ready") {
          setOrder(json.data.order as Order);
          setDownloadToken(json.data.downloadToken as string);
          setWaiting(false);
          return;
        }
      } catch {
        /* transient — the retry below covers it */
      }

      if (attempts >= 15) {
        setWaiting(false);
        return;
      }
      if (alive) setTimeout(poll, 2000);
    };

    const t = setTimeout(poll, 1500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [waiting]);

  // Skip the wait for an order this browser has already prepared, so coming
  // back to the page does not make the buyer sit through it again.
  useEffect(() => {
    if (!order?.orderId) return;
    try {
      if (sessionStorage.getItem(seenKey(order.orderId))) setSeconds(0);
    } catch {
      /* private mode — just run the countdown */
    }
  }, [order?.orderId]);

  useEffect(() => {
    if (seconds === 0) {
      if (order?.orderId) {
        try {
          sessionStorage.setItem(seenKey(order.orderId), "1");
        } catch {
          /* nothing to remember it with — harmless */
        }
      }
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, order?.orderId]);

  // Fetched during the countdown, not after it, so the buttons are ready the
  // moment the timer hits zero.
  useEffect(() => {
    if (!downloadToken) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/downloads/${downloadToken}`);
        const json = await res.json();
        if (!alive) return;
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Could not prepare your download.");
          return;
        }
        setFiles(json.data.files as DownloadFile[]);
      } catch {
        if (alive) setError("Network error — please refresh the page.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [downloadToken]);

  const productNames = order?.items.length
    ? order.items.map((i) => i.name).join(", ")
    : "3D Asset Order";

  return (
    <main className="pt-24">
      <section className="relative">
        <div className="relative mx-auto max-w-2xl px-5 py-10 text-center sm:px-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-card text-lime shadow-[0_0_40px_-16px_var(--lime)]">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">PAYMENT SUCCESSFUL</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {order
              ? "Your order has been confirmed and saved to your account."
              : waiting
                ? "Your payment went through — we're finalising your order."
                : "Your order has been confirmed."}
          </p>

          <dl className="mx-auto mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 text-left sm:grid-cols-3">
            <div>
              <dt className="font-display text-[10px] font-bold tracking-[0.14em] text-foreground">ORDER ID</dt>
              <dd className="mt-0.5 font-display text-sm font-bold">{order?.orderId ?? "—"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-display text-[10px] font-bold tracking-[0.14em] text-foreground">PRODUCT</dt>
              <dd className="mt-0.5 truncate font-display text-sm font-bold">{productNames}</dd>
            </div>
            <div>
              <dt className="font-display text-[10px] font-bold tracking-[0.14em] text-foreground">AMOUNT PAID</dt>
              <dd className="mt-0.5 font-display text-sm font-bold">
                {formatPrice(order?.total ?? 0)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-sm font-bold tracking-wide">
              {waiting
                ? "FINALISING YOUR ORDER"
                : seconds > 0
                  ? "YOUR DOWNLOAD IS BEING PREPARED"
                  : files?.some((f) => f.available)
                    ? "YOUR DOWNLOAD IS READY"
                    : "YOUR ORDER IS CONFIRMED"}
            </h2>
            {waiting ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Confirming your payment — this only
                takes a moment.
              </p>
            ) : !order ? (
              <p className="mt-3 text-xs text-muted-foreground">
                We couldn&apos;t load this order automatically. If you were charged, your files are
                waiting at{" "}
                <Link href="/downloads" className="font-semibold text-primary hover:underline">
                  Your Downloads
                </Link>{" "}
                — enter the email you paid with.
              </p>
            ) : seconds > 0 ? (
              <>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums text-gradient">
                  00:{String(seconds).padStart(2, "0")}
                </p>
                <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Preparing your secure download…
                </p>
              </>
            ) : error ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-4" /> {error}
              </p>
            ) : !files ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Fetching your files…
              </p>
            ) : files.every((f) => !f.available) ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Your order is confirmed, but the files are still being attached. We&apos;ll email
                you as soon as they&apos;re ready — your order ID is{" "}
                <span className="font-bold text-foreground">{order?.orderId}</span>.
              </p>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted-foreground">
                  Save these files somewhere safe — the links below work for 24 hours.
                </p>

                <ul className="mt-4 space-y-2 text-left">
                  {files.map((f) => (
                    <li
                      key={f.slug}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
                    >
                      {f.image && (
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
                          <Image src={f.image} alt={f.name} fill sizes="40px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {f.available
                            ? `${f.format.toUpperCase()}${f.sizeBytes ? ` · ${formatBytes(f.sizeBytes)}` : ""}`
                            : "File not attached yet"}
                        </p>
                      </div>
                      {f.available ? (
                        <a
                          href={`/api/downloads/${downloadToken}/${f.slug}`}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-bold tracking-wide text-primary-foreground"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          DOWNLOAD <Download className="size-3" />
                        </a>
                      ) : (
                        <span className="shrink-0 text-[11px] text-muted-foreground">Pending</span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Says plainly how to get back here — the links do expire. */}
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Lost your files? Get them again anytime from{" "}
                  <Link href="/downloads" className="font-semibold text-primary hover:underline">
                    Your Downloads
                  </Link>{" "}
                  using order <span className="font-bold text-foreground">{order?.orderId}</span>{" "}
                  and your email.
                </p>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/models"
              className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold tracking-wide hover:bg-secondary"
            >
              CONTINUE BROWSING
            </Link>
            <Link
              href="/complaint"
              className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold tracking-wide hover:bg-secondary"
            >
              NEED HELP?
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
