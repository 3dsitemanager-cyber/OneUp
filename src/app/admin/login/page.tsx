import type { Metadata } from "next";
import Image from "next/image";
import { Images, Package, Receipt } from "lucide-react";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In — OneUp Gaming",
  description: "Restricted access to the OneUp Gaming marketplace admin portal.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand half — carries the storefront identity into the portal. */}
      <section
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ background: "var(--gradient-footer)" }}
      >
        <div className="h-1.5 w-24 rounded-full" style={{ background: "var(--gradient-primary)" }} />

        <div className="relative">
          <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_18px_44px_-18px_rgba(0,0,0,0.7)]">
            <Image
              src="/assets/logo.png"
              alt="OneUp Gaming"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </span>
          <h2 className="mt-7 max-w-md font-display text-4xl font-bold leading-tight text-white">
            MANAGE YOUR 3D MARKETPLACE
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
            Publish assets, track orders and manage customers — everything for OneUp Gaming in one
            portal.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { icon: Package, text: "Add and edit 3D asset listings" },
              { icon: Receipt, text: "Track orders and revenue live" },
              { icon: Images, text: "Upload media straight to Cloudinary" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm font-medium text-white">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
                  <f.icon className="size-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-medium text-white/70">
          © {new Date().getFullYear()} OneUp Gaming. All rights reserved.
        </p>
      </section>

      <section className="flex items-center justify-center bg-secondary/40 px-5 py-16">
        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>
      </section>
    </main>
  );
}
