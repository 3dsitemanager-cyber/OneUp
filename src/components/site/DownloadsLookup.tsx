"use client";

import Image from "next/image";
import { AlertCircle, Download, Loader2, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { formatBytes } from "@/lib/upload-policy";

type DownloadFile = {
  slug: string;
  name: string;
  image: string;
  available: boolean;
  sizeBytes: number;
  format: string;
};

/** Lets a buyer re-open their downloads with the order ID and their email. */
export function DownloadsLookup() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DownloadFile[] | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setFiles(null);
    try {
      const res = await fetch("/api/downloads/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not find that order.");
        return;
      }

      const issued = json.data.token as string;
      setToken(issued);

      const listRes = await fetch(`/api/downloads/${issued}`);
      const listJson = await listRes.json();
      if (!listRes.ok || !listJson.ok) {
        setError(listJson.error ?? "Could not load your files.");
        return;
      }
      setFiles(listJson.data.files as DownloadFile[]);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary";

  return (
    <main className="pt-28">
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">YOUR DOWNLOADS</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your order ID and the email you checked out with to get your files again.
        </p>

        <form onSubmit={handleSubmit} className="mt-9 rounded-2xl border border-border bg-card p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-display text-[11px] font-bold tracking-[0.14em] text-foreground">
                ORDER ID
              </span>
              <input
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="VU-XXXXXX"
                className={field}
              />
            </label>
            <label className="block">
              <span className="font-display text-[11px] font-bold tracking-[0.14em] text-foreground">
                EMAIL
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className={field}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold tracking-wide text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {busy ? "LOOKING UP…" : "FIND MY FILES"}
          </button>

          {error && (
            <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </p>
          )}
        </form>

        {files && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-7">
            <h2 className="font-display text-lg font-bold">
              {files.some((f) => f.available) ? "YOUR FILES" : "FILES NOT READY YET"}
            </h2>

            {files.every((f) => !f.available) ? (
              <p className="mt-3 text-sm text-muted-foreground">
                This order is confirmed, but its files haven&apos;t been attached yet. Please check
                back shortly.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {files.map((f) => (
                  <li
                    key={f.slug}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    {f.image && (
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                        <Image src={f.image} alt={f.name} fill sizes="48px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.available
                          ? `${f.format.toUpperCase()}${f.sizeBytes ? ` · ${formatBytes(f.sizeBytes)}` : ""}`
                          : "File not attached yet"}
                      </p>
                    </div>
                    {f.available ? (
                      <a
                        href={`/api/downloads/${token}/${f.slug}`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wide text-primary-foreground"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        DOWNLOAD <Download className="size-3.5" />
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">Pending</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
