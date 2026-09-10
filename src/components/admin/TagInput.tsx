"use client";

import { Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Optional one-click suggestions; clicking toggles the value. */
  suggestions?: readonly string[];
  max?: number;
};

/**
 * Free-text list editor. Enter or comma commits an entry, so the admin can type
 * any value rather than picking from a fixed list.
 */
export function TagInput({ value, onChange, placeholder, suggestions, max = 20 }: Props) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const entry = raw.trim().replace(/,$/, "").trim();
    if (!entry) return;
    // Case-insensitive de-dupe so "FBX" and "fbx" don't both land.
    if (value.some((v) => v.toLowerCase() === entry.toLowerCase())) {
      setDraft("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, entry]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      // Enter must not submit the surrounding product form.
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const toggle = (s: string) =>
    value.some((v) => v.toLowerCase() === s.toLowerCase())
      ? onChange(value.filter((v) => v.toLowerCase() !== s.toLowerCase()))
      : commit(s);

  return (
    <div>
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border-2 border-border bg-background px-3 py-2.5 transition-colors focus-within:border-brand">
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          className="min-w-[9rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => {
            const on = value.some((v) => v.toLowerCase() === s.toLowerCase());
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  on
                    ? "border-brand bg-brand text-white"
                    : "border-border text-muted-foreground hover:border-brand hover:text-brand"
                }`}
              >
                {!on && <Plus className="size-3" />}
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
