"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Images,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Package,
  PlusCircle,
  Receipt,
  Store,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  // Products also owns /admin/products/[slug]/edit, but not /admin/products/new,
  // which is its own entry below — hence the explicit predicate.
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
    exact: false,
    isActive: (p: string) => p === "/admin/products" || p.endsWith("/edit"),
  },
  { href: "/admin/products/new", label: "Add Product", icon: PlusCircle, exact: false },
  { href: "/admin/orders", label: "Orders", icon: Receipt, exact: false },
  { href: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { href: "/admin/messages", label: "Messages", icon: Mail, exact: false },
  { href: "/admin/complaints", label: "Support", icon: LifeBuoy, exact: false },
  { href: "/admin/media", label: "Media", icon: Images, exact: false },
] as const;

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <aside
      className="sticky top-6 flex h-fit flex-col overflow-hidden rounded-2xl shadow-[0_18px_50px_-30px_rgba(0,0,0,0.6)]"
      style={{ background: "var(--gradient-footer)" }}
    >
      <div className="h-1.5 w-full" style={{ background: "var(--gradient-primary)" }} />

      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
          <Image src="/assets/logo.png" alt="OneUp Gaming" fill sizes="44px" className="object-contain" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold leading-tight text-white">ONEUP GAMING</p>
          <p className="text-[10px] font-bold tracking-[0.18em] text-white/70">ADMIN PORTAL</p>
        </div>
      </div>

      <div className="mx-5 truncate rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white ring-1 ring-white/25" title={email}>
        {email}
      </div>

      <nav className="mt-4 space-y-1 px-3">
        {nav.map((n) => {
          const active =
            "isActive" in n
              ? n.isActive(pathname)
              : n.exact
                ? pathname === n.href
                : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "bg-white text-brand shadow-[0_6px_18px_-8px_rgba(0,0,0,0.5)]"
                  : "text-white/85 hover:translate-x-0.5 hover:bg-white/15 hover:text-white"
              }`}
            >
              <n.icon className="size-4 shrink-0" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-1 border-t border-white/25 px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/15 hover:text-white"
        >
          <Store className="size-4 shrink-0" /> View storefront
        </Link>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
        >
          <LogOut className="size-4 shrink-0" /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
