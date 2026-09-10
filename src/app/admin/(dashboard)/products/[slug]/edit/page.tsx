import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductForAdmin } from "@/server/queries";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export const metadata: Metadata = {
  title: "Edit Product — OneUp Gaming Admin",
  description: "Update a 3D asset listed on the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductForAdmin(slug);
  if (!product) notFound();

  return <AdminProductForm product={product} />;
}
