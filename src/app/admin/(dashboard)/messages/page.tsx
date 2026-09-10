import type { Metadata } from "next";
import { getContactMessages } from "@/server/queries";
import { AdminMessagesTable } from "@/components/admin/AdminMessagesTable";

export const metadata: Metadata = {
  title: "Messages — OneUp Gaming Admin",
  description: "Contact form messages sent to the OneUp Gaming marketplace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();
  return <AdminMessagesTable initialMessages={messages} />;
}
