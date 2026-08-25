import type { Metadata } from "next";
import { getOrders } from "@/server/queries";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";

export const metadata: Metadata = {
  title: "Orders — OneUp Gaming Admin",
  description: "Track marketplace orders, payment status and digital delivery for OneUp Gaming.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return <AdminOrdersTable initialOrders={orders} />;
}
