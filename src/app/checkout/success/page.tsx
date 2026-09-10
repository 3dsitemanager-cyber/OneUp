import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { serializeOrder } from "@/server/serialize";
import { createDownloadToken } from "@/server/download-token";
import { stripe, stripeConfigured } from "@/server/stripe";
import { SuccessView } from "@/components/site/SuccessView";
import type { Order as OrderType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Payment Successful — OneUp Gaming",
  description: "Your order is confirmed and your download is preparing.",
  robots: { index: false },
};

export const revalidate = 0;

/**
 * Stripe returns the buyer here with `?session_id=…`.
 *
 * The order is looked up by that session id rather than by order id: session
 * ids are long and unguessable, whereas order ids are short enough to walk, and
 * this page mints a download token. Confirming the session with Stripe first
 * means a stranger holding someone else's session id still gets nothing.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let order: OrderType | null = null;
  let downloadToken: string | null = null;
  let pending = false;

  if (sessionId && stripeConfigured()) {
    try {
      // Ask Stripe whether this session was really paid before showing anything.
      const session = await stripe().checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        await connectToDatabase();
        const doc = await Order.findOne({ stripeSessionId: sessionId }).lean().exec();

        if (doc) {
          order = serializeOrder(doc as Record<string, unknown>);
          // Minted server-side: the browser never sees the signing secret.
          downloadToken = createDownloadToken(order.orderId);
        } else {
          // Paid, but the webhook has not landed yet — a normal race of a few
          // seconds. The view polls rather than claiming the order failed.
          pending = true;
        }
      }
    } catch (error) {
      console.error("[checkout/success]", error);
    }
  }

  return <SuccessView order={order} downloadToken={downloadToken} pending={pending} />;
}
