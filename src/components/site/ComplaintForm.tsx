"use client";

import { Clock, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { COMPLAINT_TYPES } from "@/lib/types";
import { FileUpload } from "@/components/site/FileUpload";
import type { StoredFile } from "@/lib/upload-policy";

const types = COMPLAINT_TYPES;

export function ComplaintForm({ productNames }: { productNames: string[] }) {
  const empty = {
    orderId: "",
    email: "",
    product: productNames[0] ?? "",
    type: types[types.length - 1] as string,
    description: "",
  };

  const [form, setForm] = useState(empty);
  const [attachment, setAttachment] = useState<StoredFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, attachment }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        toast.error(json.issues?.[0]?.message ?? json.error ?? "Could not submit your complaint.");
        return;
      }

      toast.success("Complaint submitted — we'll email you shortly.");
      setForm(empty);
      setAttachment(null);
    } catch {
      toast.error("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const set = (key: keyof typeof empty) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Order ID"
          placeholder="VU-4F82KD"
          required
          value={form.orderId}
          onChange={set("orderId")}
        />
        <Field
          label="Email"
          type="email"
          placeholder="you@studio.com"
          required
          value={form.email}
          onChange={set("email")}
        />
        <label className="block">
          <Label>Product</Label>
          <select
            value={form.product}
            onChange={(e) => set("product")(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          >
            {productNames.length === 0 && <option value="">—</option>}
            {productNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <Label>Complaint Type</Label>
          <select
            value={form.type}
            onChange={(e) => set("type")(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          >
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block">
        <Label>Description</Label>
        <textarea
          required
          rows={6}
          minLength={10}
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="Describe the issue in detail..."
          className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary"
        />
      </label>
      <div className="mt-4">
        <Label>Attachment (optional)</Label>
        <div className="mt-2">
          <FileUpload
            kind="complaint-attachment"
            value={attachment}
            onChange={setAttachment}
            label="Attach a screenshot or log file"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_18px_50px_-18px_var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--gradient-primary)" }}
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "SUBMITTING…" : "SUBMIT COMPLAINT"}
      </button>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-4 text-cyan" /> We usually respond within 24–48 hours.
      </p>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
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
        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary"
      />
    </label>
  );
}
