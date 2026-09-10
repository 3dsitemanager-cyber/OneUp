"use client";

import { LifeBuoy, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { COMPLAINT_STATUSES, type Complaint, type ComplaintStatus } from "@/lib/types";
import { formatBytes } from "@/lib/upload-policy";

const tone: Record<ComplaintStatus, string> = {
  Open: "border-destructive/40 bg-destructive/10 text-destructive",
  "In Review": "border-primary/40 bg-primary/10 text-primary",
  Resolved: "border-lime/40 bg-lime/10 text-lime",
};

const FILTERS = ["All", ...COMPLAINT_STATUSES] as const;

export function AdminComplaintsTable({ initialComplaints }: { initialComplaints: Complaint[] }) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  const open = complaints.filter((c) => c.status === "Open").length;

  const rows = useMemo(
    () => (filter === "All" ? complaints : complaints.filter((c) => c.status === filter)),
    [complaints, filter],
  );

  async function updateStatus(id: string, status: ComplaintStatus) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not update that ticket.");
        return;
      }
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      toast.success(`Ticket marked ${status.toLowerCase()}`);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, orderId: string) {
    if (!window.confirm(`Delete the ticket for ${orderId}? This cannot be undone.`)) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/complaints/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not delete that ticket.");
        return;
      }
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      toast.success("Ticket deleted");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl font-bold">SUPPORT TICKETS</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {complaints.length} tickets · {open} open
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === f
                ? "border-brand bg-brand text-white"
                : "border-border text-foreground hover:border-brand"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((c) => (
          <article key={c.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
                <LifeBuoy className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-bold">{c.orderId}</span>
                  <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground">
                    {c.type.toUpperCase()}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${tone[c.status]}`}
                  >
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.email}
                  {c.product ? ` · ${c.product}` : ""} · {formatDate(c.createdAt)}
                </p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {c.description}
                </p>

                {c.attachment && (
                  <a
                    href={c.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold transition-colors hover:border-brand hover:text-brand"
                  >
                    <Paperclip className="size-3.5" />
                    {c.attachment.originalFilename || "Attachment"}
                    {c.attachment.bytes > 0 && (
                      <span className="text-muted-foreground">
                        ({formatBytes(c.attachment.bytes)})
                      </span>
                    )}
                  </a>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <a
                    href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.orderId} — ${c.type}`)}`}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold tracking-wide text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    REPLY BY EMAIL
                  </a>
                  <select
                    value={c.status}
                    disabled={busyId === c.id}
                    onChange={(e) => updateStatus(c.id, e.target.value as ComplaintStatus)}
                    aria-label={`Status for ${c.orderId}`}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide outline-none disabled:opacity-60 ${tone[c.status]}`}
                  >
                    {COMPLAINT_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-card text-foreground">
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(c.id, c.orderId)}
                    disabled={busyId === c.id}
                    aria-label={`Delete ticket ${c.orderId}`}
                    className="ml-auto flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                  >
                    {busyId === c.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        {rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-14 text-center">
            <p className="font-display text-xl font-bold">
              {complaints.length === 0 ? "NO TICKETS YET" : "NOTHING HERE"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {complaints.length === 0
                ? "Support tickets raised from the complaint form land here."
                : `No ${filter.toLowerCase()} tickets right now.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
