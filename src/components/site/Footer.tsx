"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Github, Instagram, Twitter, Youtube } from "lucide-react";
import type { Category } from "@/lib/types";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Support",
    links: [
      { label: "Your Downloads", href: "/downloads" },
      { label: "Contact", href: "/contact" },
      { label: "Complaints", href: "/complaint" },
      { label: "FAQ", href: "/about" },
      { label: "Refund Policy", href: "/about" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Categories", href: "/categories" },
      { label: "Your Cart", href: "/cart" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  // See Navbar: the early return cannot stop a hook, so the fetch is disabled
  // explicitly on admin routes where this footer never renders.
  const isAdmin = pathname.startsWith("/admin");

  // Marketplace column is built from live categories that have listings.
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "withProducts"],
    queryFn: async (): Promise<Category[]> => {
      const res = await fetch("/api/categories?withProducts=1");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not load categories");
      return json.data as Category[];
    },
    enabled: !isAdmin,
    // Shares its cache entry with the header — see Navbar for why it stays fresh.
    staleTime: 0,
    refetchOnMount: "always",
  });

  const marketplace = {
    title: "Marketplace",
    links: [
      { label: "All Models", href: "/models" },
      ...categories.map((c) => ({
        label: c.name,
        href: `/models?category=${encodeURIComponent(c.name)}`,
      })),
    ],
  };

  const allColumns = [marketplace, ...columns];

  if (isAdmin) return null;

  return (
    <footer className="relative overflow-hidden" style={{ background: "var(--gradient-footer)" }}>
      {/* Red keyline ties the blue panel back to the brand's second colour. */}
      <div className="h-1.5 w-full" style={{ background: "var(--gradient-primary)" }} />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_-12px_rgba(0,0,0,0.6)]">
              <Image
                src="/assets/logo.png"
                alt="OneUp Gaming"
                fill
                sizes="56px"
                className="object-contain"
              />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              ONEUP GAMING
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-white">
            Premium game-ready 3D assets for studios and independent creators. Characters,
            environments, vehicles and props — delivered instantly.
          </p>
          <div className="mt-6 flex gap-2.5">
            {[Twitter, Instagram, Youtube, Github].map((Icon, i) => (
              <span
                key={i}
                className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/35 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-brand"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>

        {allColumns.map((col) => (
          <div key={col.title}>
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-white">
              <span className="h-4 w-1 rounded-full bg-primary" />
              {col.title.toUpperCase()}
            </h4>
            <ul className="mt-4 space-y-1">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="group flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-white transition-all hover:translate-x-1"
                  >
                    <ChevronRight className="size-3.5 shrink-0 text-white/50 transition-colors group-hover:text-primary-foreground" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/25 px-5 py-6 text-xs font-medium text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} OneUp Gaming. All rights reserved.</p>
        <div className="flex gap-5">
          {["Privacy Policy", "Terms", "License"].map((t) => (
            <span key={t} className="cursor-pointer underline-offset-4 hover:underline">
              {t}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
