import type { Metadata } from "next";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export const metadata: Metadata = {
  title: "Add Product — OneUp Gaming Admin",
  description: "Publish a new 3D asset to the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminNewProductPage() {
  return <AdminProductForm />;
}
