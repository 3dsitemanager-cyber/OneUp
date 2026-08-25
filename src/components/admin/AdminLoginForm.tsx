"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Sign in failed. Please try again.");
        return;
      }

      // Only follow `next` when it is an in-app admin path — never an absolute URL.
      const target = nextPath?.startsWith("/admin") ? nextPath : "/admin";
      router.replace(target);
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)]"
      >
        {/* Branded header so the portal reads as part of the storefront. */}
        <div
          className="flex flex-col items-center px-8 py-7 text-center"
          style={{ background: "var(--gradient-footer)" }}
        >
          <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_-14px_rgba(0,0,0,0.6)]">
            <Image
              src="/assets/logo.png"
              alt="OneUp Gaming"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">ADMIN SIGN IN</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white/80">
            <Lock className="size-3.5" /> Restricted to marketplace administrators
          </p>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            <label className="block">
              <span className="text-[11px] font-bold tracking-[0.14em] text-foreground">
                USERNAME
              </span>
              <input
                type="text"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
                className="mt-2 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold tracking-[0.14em] text-foreground">
                PASSWORD
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand"
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border-2 border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "SIGNING IN…" : "SIGN IN"}
          </button>

          <p className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-lime" /> Sessions are signed, httpOnly and
            expire after 8 hours.
          </p>
        </div>
      </form>
    </div>
  );
}
