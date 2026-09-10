"use client";

import { Link as LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";

const tone: Record<OrderStatus, string> = {
  Paid: "border-primary/40 bg-primary/10 text-primary",
  Delivered: "border-lime/40 bg-lime/10 text-lime",
  Refunded: "border-destructive/40 bg-destructive/10 text-destructive",
  Pending: "border-border bg-surface text-muted-foreground",
};

export function AdminOrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<string | null>(null);

  /** Mints a fresh 24-hour link and puts it on the clipboard for support. */
  async function copyDownloadLink(orderId: string) {
    setLinkFor(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/download-link`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not create a download link.");
        return;
      }
      await navigator.clipboard.writeText(json.data.url);
      toast.success("Download link copied — valid for 24 hours.");
    } catch {
      toast.error("Could not copy the link.");
    } finally {
      setLinkFor(null);
    }
  }

  const revenue = orders
    .filter((o) => o.status !== "Refunded")
    .reduce((sum, o) => sum + o.total, 0);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not update that order.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status } : o)));
      toast.success(`${orderId} marked ${status.toLowerCase()}`);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl font-bold">ORDERS</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {orders.length} orders · {formatPrice(revenue)} collected
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-[11px] tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-bold">ORDER</th>
              <th className="px-5 py-4 font-bold">CUSTOMER</th>
              <th className="px-5 py-4 font-bold">ITEMS</th>
              <th className="px-5 py-4 font-bold">DATE</th>
              <th className="px-5 py-4 font-bold">TOTAL</th>
              <th className="px-5 py-4 font-bold">STATUS</th>
              <th className="px-5 py-4 text-right font-bold">FILES</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-4 font-semibold">{o.orderId}</td>
                <td className="px-5 py-4">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.email}</p>
                </td>
                <td className="max-w-[220px] px-5 py-4">
                  <span className="line-clamp-2 text-muted-foreground">
                    {o.items.map((i) => i.name).join(", ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{formatDate(o.createdAt)}</td>
                <td className="px-5 py-4">{formatPrice(o.total)}</td>
                <td className="px-5 py-4">
                  <select
                    value={o.status}
                    disabled={busyId === o.orderId}
                    onChange={(e) => updateStatus(o.orderId, e.target.value as OrderStatus)}
                    aria-label={`Status for ${o.orderId}`}
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide outline-none disabled:opacity-60 ${tone[o.status]}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-card text-foreground">
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-right">
                  {["Paid", "Delivered"].includes(o.status) ? (
                    <button
                      type="button"
                      onClick={() => copyDownloadLink(o.orderId)}
                      disabled={linkFor === o.orderId}
                      title="Copy a 24-hour download link to send this buyer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      {linkFor === o.orderId ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <LinkIcon className="size-3.5" />
                      )}
                      LINK
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  No orders yet. Complete a checkout on the storefront and it will appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
