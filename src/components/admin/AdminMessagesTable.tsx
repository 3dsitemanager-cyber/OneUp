"use client";

import { Loader2, Mail, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { CONTACT_STATUSES, type ContactMessage, type ContactStatus } from "@/lib/types";

const tone: Record<ContactStatus, string> = {
  New: "border-primary/40 bg-primary/10 text-primary",
  Read: "border-border bg-surface text-muted-foreground",
  Replied: "border-lime/40 bg-lime/10 text-lime",
};

export function AdminMessagesTable({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const unread = messages.filter((m) => m.status === "New").length;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return messages;
    return messages.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.email.toLowerCase().includes(needle) ||
        m.subject.toLowerCase().includes(needle),
    );
  }, [messages, q]);

  async function updateStatus(id: string, status: ContactStatus) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not update that message.");
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, subject: string) {
    if (!window.confirm(`Delete "${subject}"? This cannot be undone.`)) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not delete that message.");
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Message deleted");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  /** Opening an unread message marks it read, the way an inbox would. */
  function toggleOpen(m: ContactMessage) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && m.status === "New") void updateStatus(m.id, "Read");
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl font-bold">MESSAGES</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {messages.length} messages · {unread} unread
        </p>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, email or subject…"
        aria-label="Search messages"
        className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />

      <div className="space-y-3">
        {rows.map((m) => {
          const open = openId === m.id;
          return (
            <article
              key={m.id}
              className={`rounded-2xl border bg-card transition-colors ${
                m.status === "New" ? "border-primary/40" : "border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleOpen(m)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-6 py-5 text-left"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
                  <Mail className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{m.subject}</span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${tone[m.status]}`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {m.name} · {m.email} · {formatDate(m.createdAt)}
                  </span>
                </span>
              </button>

              {open && (
                <div className="border-t border-border px-6 py-5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {m.message}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                      onClick={() => void updateStatus(m.id, "Replied")}
                      className="rounded-xl px-5 py-2.5 text-xs font-bold tracking-wide text-primary-foreground"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      REPLY BY EMAIL
                    </a>
                    <select
                      value={m.status}
                      disabled={busyId === m.id}
                      onChange={(e) => updateStatus(m.id, e.target.value as ContactStatus)}
                      aria-label={`Status for ${m.subject}`}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide outline-none disabled:opacity-60 ${tone[m.status]}`}
                    >
                      {CONTACT_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-card text-foreground">
                          {s.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(m.id, m.subject)}
                      disabled={busyId === m.id}
                      aria-label={`Delete ${m.subject}`}
                      className="ml-auto flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                    >
                      {busyId === m.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-14 text-center">
            <p className="font-display text-xl font-bold">
              {messages.length === 0 ? "NO MESSAGES YET" : "NO MATCHES"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {messages.length === 0
                ? "Messages sent from the contact form land here."
                : "No messages match that search."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
