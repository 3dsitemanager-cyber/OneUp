import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/require-admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Sits in a route group so /admin/login renders without this chrome.
 * middleware.ts already redirects anonymous visitors — this is the second gate.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-secondary/40">
      <div className="mx-auto grid max-w-[1500px] items-start gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[260px_1fr]">
        <AdminNav email={session.email} />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
