"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import type { Category } from "@/lib/types";

// Products sits between these two and renders its own category dropdown.
const navBefore = [{ href: "/", label: "Home" }] as const;
const navAfter = [
  { href: "/complaint", label: "Complaint" },
  { href: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { count, hydrated } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  // Close the mobile sheet whenever navigation lands on a new page.
  useEffect(() => {
    setOpen(false);
    setProductsOpen(false);
  }, [pathname]);

  // Dismiss the Products dropdown on an outside click or Escape.
  useEffect(() => {
    if (!productsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!productsRef.current?.contains(e.target as Node)) setProductsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProductsOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [productsOpen]);

  // The admin portal has its own chrome, so this header never renders there.
  // Hooks cannot be skipped, so the early return below cannot prevent the fetch
  // — `enabled` has to, or every admin page load would request categories for a
  // menu nobody sees.
  const isAdmin = pathname.startsWith("/admin");

  // Categories are admin-managed, so the submenu is fetched rather than hardcoded.
  // withProducts=1: only categories that actually have listings, with real counts.
  // Kept fresh rather than cached: the header persists across navigation, so a
  // stale window here shows renamed or emptied categories long after the edit.
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "withProducts"],
    queryFn: async (): Promise<Category[]> => {
      const res = await fetch("/api/categories?withProducts=1");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not load categories");
      return json.data as Category[];
    },
    enabled: !isAdmin,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  if (isAdmin) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background shadow-[0_6px_24px_-18px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            <Image
              src="/assets/logo.png"
              alt="OneUp Gaming"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight text-foreground sm:inline">
            ONE<span className="text-primary">UP GAMING</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border-2 border-border bg-secondary/60 p-1.5 lg:flex">
          {navBefore.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? "bg-brand text-white"
                  : "text-foreground hover:bg-secondary hover:text-brand"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div ref={productsRef} className="relative">
            <button
              onClick={() => setProductsOpen((v) => !v)}
              aria-expanded={productsOpen}
              aria-haspopup="menu"
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive("/models") || productsOpen
                  ? "bg-brand text-white"
                  : "text-foreground hover:bg-secondary hover:text-brand"
              }`}
            >
              Products
              <ChevronDown
                className={`size-4 transition-transform ${productsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {productsOpen && (
              <div className="reveal absolute left-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
                <Link
                  href="/models"
                  className="block rounded-xl px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  All Products
                </Link>
                {categories.length > 0 && <div className="my-1 h-px bg-border" />}
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/models?category=${encodeURIComponent(c.name)}`}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {c.name}
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {c.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {navAfter.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? "bg-brand text-white"
                  : "text-foreground hover:bg-secondary hover:text-brand"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/models"
            className="hidden size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:text-brand sm:flex"
            aria-label="Search models"
          >
            <Search className="size-4" />
          </Link>
          <Link
            href="/cart"
            className="relative flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:text-brand"
            aria-label="Cart"
          >
            <ShoppingCart className="size-4" />
            {hydrated && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-2 ring-white/90">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/models"
            className="hidden rounded-full px-6 py-2.5 text-xs font-bold tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_var(--primary)] lg:block"
            style={{ background: "var(--gradient-primary)" }}
          >
            EXPLORE MODELS
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:text-brand lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="reveal border-t border-border px-4 pb-4 pt-2 lg:hidden">
          {navBefore.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 block rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                isActive(item.href) ? "bg-brand text-white" : "text-foreground hover:bg-secondary hover:text-brand"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/models"
            className={`block rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
              isActive("/models") ? "bg-brand text-white" : "text-foreground hover:bg-secondary hover:text-brand"
            }`}
          >
            Products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/models?category=${encodeURIComponent(c.name)}`}
              className="block rounded-xl py-2.5 pl-8 pr-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-brand"
            >
              {c.name}
            </Link>
          ))}
          {navAfter.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mt-1 block rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                isActive(item.href) ? "bg-brand text-white" : "text-foreground hover:bg-secondary hover:text-brand"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
