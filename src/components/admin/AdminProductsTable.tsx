"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function AdminProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [q, setQ] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle),
    );
  }, [products, q]);

  async function deleteProduct(slug: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This removes the listing permanently.`)) return;

    setBusySlug(slug);
    try {
      const res = await fetch(`/api/products/${slug}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not delete that asset.");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.slug !== slug));
      toast.success(`${name} deleted`);
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusySlug(null);
    }
  }

  async function reseed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Seeding failed.");
        return;
      }
      toast.success(
        `Catalogue restored — ${json.data.products.inserted} added, ${json.data.products.updated} updated`,
      );
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h1 className="font-display text-3xl font-bold">ASSETS</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {products.length} listings published.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={reseed}
            disabled={seeding}
            className="flex items-center gap-2 rounded-xl border-2 border-border px-5 py-2.5 text-sm font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {seeding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {seeding ? "RESTORING…" : "RESTORE CATALOGUE"}
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="size-4" /> ADD PRODUCT
          </Link>
        </div>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search assets or categories…"
        aria-label="Search assets"
        className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-[11px] tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-bold">ASSET</th>
              <th className="px-5 py-4 font-bold">CATEGORY</th>
              <th className="px-5 py-4 font-bold">PRICE</th>
              <th className="px-5 py-4 font-bold">SALES</th>
              <th className="px-5 py-4 text-right font-bold">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.slug} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                      <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                    </div>
                    <span className="font-semibold">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{p.category}</td>
                <td className="px-5 py-4">{formatPrice(p.price)}</td>
                <td className="px-5 py-4 text-muted-foreground">{p.sales}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/models/${p.slug}`}
                      target="_blank"
                      aria-label={`Open ${p.name} on the storefront`}
                      className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                    <button
                      onClick={() => deleteProduct(p.slug, p.name)}
                      disabled={busySlug === p.slug}
                      aria-label={`Delete ${p.name}`}
                      className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                    >
                      {busySlug === p.slug ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  {products.length === 0
                    ? "No assets in the database yet — use Restore Catalogue or run npm run seed."
                    : "No assets match that search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
