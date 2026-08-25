import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { serializeOrder } from "@/server/serialize";
import { SuccessView } from "@/components/site/SuccessView";
import type { Order as OrderType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Payment Successful — OneUp Gaming",
  description: "Your order is confirmed and your download is preparing.",
  robots: { index: false },
};

export const revalidate = 0;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let order: OrderType | null = null;
  if (orderId) {
    // A missing/stale id should still render the confirmation shell, not a 500.
    try {
      await connectToDatabase();
      const doc = await Order.findOne({ orderId: orderId.toUpperCase() }).lean().exec();
      if (doc) order = serializeOrder(doc as Record<string, unknown>);
    } catch (error) {
      console.error(error);
    }
  }

  return <SuccessView order={order} />;
}
