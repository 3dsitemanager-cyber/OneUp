"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const EMPTY = { name: "", email: "", subject: "", message: "" };

/** Posts to /api/contact, which stores the message in MongoDB. */
export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        toast.error(json.issues?.[0]?.message ?? json.error ?? "Could not send your message.");
        return;
      }

      toast.success("Message sent — we'll be in touch soon.");
      setForm(EMPTY);
    } catch {
      toast.error("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={handleSubmit}
      className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24"
    >
      <h2 className="font-display text-sm font-bold tracking-wide">SEND A MESSAGE</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Name" placeholder="Alex Mercer" required value={form.name} onChange={set("name")} />
        <Field
          label="Email"
          type="email"
          placeholder="alex@studio.com"
          required
          value={form.email}
          onChange={set("email")}
        />
        <div className="sm:col-span-2">
          <Field
            label="Subject"
            placeholder="Custom character commission"
            required
            value={form.subject}
            onChange={set("subject")}
          />
        </div>
      </div>
      <label className="mt-3 block">
        <Label>Message</Label>
        <textarea
          required
          rows={4}
          minLength={10}
          value={form.message}
          onChange={(e) => set("message")(e.target.value)}
          placeholder="Tell us about your project..."
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold tracking-wide text-primary-foreground shadow-[0_14px_40px_-18px_var(--primary)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--gradient-primary)" }}
      >
        {submitting ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> SENDING…
          </>
        ) : (
          <>
            SEND MESSAGE <ArrowRight className="size-3.5" />
          </>
        )}
      </button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[11px] font-bold tracking-[0.14em] text-foreground">
      {String(children).toUpperCase()}
    </span>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
      />
    </label>
  );
}
