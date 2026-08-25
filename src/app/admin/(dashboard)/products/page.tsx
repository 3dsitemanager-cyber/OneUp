import type { Metadata } from "next";
import { getProducts } from "@/server/queries";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";

export const metadata: Metadata = {
  title: "Manage Assets — OneUp Gaming Admin",
  description: "Review, search and manage every 3D asset listed on the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts();
  return <AdminProductsTable initialProducts={products} />;
}
