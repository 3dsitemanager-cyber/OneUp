"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/site/FileUpload";
import type { Category } from "@/lib/types";
import type { StoredFile } from "@/lib/upload-policy";

type Props = {
  value: string;
  onChange: (name: string) => void;
  className?: string;
};

/**
 * Categories come from MongoDB, not a hardcoded list, so the picker loads them
 * and lets the admin create a new one without leaving the product form.
 */
export function CategorySelect({ value, onChange, className }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<StoredFile | null>(null);

  // Refs so the one-shot loader can read the latest props without re-running.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (!alive) return;
        if (json.ok) {
          const list = json.data as Category[];
          setCategories(list);
          // Default to the first category rather than leaving the field blank.
          if (!valueRef.current && list[0]) onChangeRef.current(list[0].name);
        }
      } catch {
        if (alive) toast.error("Could not load categories.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function create() {
    if (!name.trim()) {
      toast.error("Give the category a name.");
      return;
    }
    if (!image) {
      toast.error("A tile image is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: image.url }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not create that category.");
        return;
      }
      const created = json.data as Category;
      setCategories((prev) => [...prev, created]);
      onChange(created.name);
      setName("");
      setImage(null);
      setCreating(false);
      toast.success(`${created.name} created`);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <div className="mt-2 rounded-xl border-2 border-brand bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold tracking-[0.14em]">NEW CATEGORY</p>
          <button
            type="button"
            onClick={() => setCreating(false)}
            aria-label="Cancel new category"
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sci-Fi Props"
          className="mt-3 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand"
        />

        <div className="mt-3">
          <FileUpload
            kind="product-image"
            value={image}
            onChange={setImage}
            label="Category tile image *"
            allowDelete
          />
        </div>

        <button
          type="button"
          onClick={create}
          disabled={saving}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wide text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "CREATING…" : "CREATE CATEGORY"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={className}
      >
        {loading && <option>Loading…</option>}
        {!loading && categories.length === 0 && <option value="">No categories yet</option>}
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setCreating(true)}
        title="Create a new category"
        aria-label="Create a new category"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-border px-3 text-xs font-bold transition-colors hover:border-brand hover:text-brand"
      >
        <Plus className="size-4" /> NEW
      </button>
    </div>
  );
}
