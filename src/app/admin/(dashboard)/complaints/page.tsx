import type { Metadata } from "next";
import { getComplaints } from "@/server/queries";
import { AdminComplaintsTable } from "@/components/admin/AdminComplaintsTable";

export const metadata: Metadata = {
  title: "Support Tickets — OneUp Gaming Admin",
  description: "Customer complaints and support tickets for the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminComplaintsPage() {
  const complaints = await getComplaints();
  return <AdminComplaintsTable initialComplaints={complaints} />;
}
