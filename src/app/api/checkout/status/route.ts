import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { createDownloadToken } from "@/server/download-token";
import { serializeOrder } from "@/server/serialize";
import { stripe, stripeConfigured } from "@/server/stripe";

export const dynamic = "force-dynamic";

/**
 * GET /api/checkout/status?session_id=… — has the webhook landed yet?
 *
 * The success page polls this for the few seconds between Stripe redirecting
 * the buyer back and the webhook writing the order. Access is gated on Stripe
 * confirming the session was paid, so holding someone else's session id is not
 * enough to be handed their order or a download token.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) return fail("Missing session_id.", 400);
    if (!stripeConfigured()) return fail("Payments are not configured.", 503);

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return ok({ status: "unpaid" as const });
    }

    await connectToDatabase();
    const doc = await Order.findOne({ stripeSessionId: sessionId }).lean().exec();
    if (!doc) {
      // Paid, but not recorded yet. The caller should keep waiting.
      return ok({ status: "pending" as const });
    }

    const order = serializeOrder(doc as Record<string, unknown>);
    return ok({
      status: "ready" as const,
      order,
      downloadToken: createDownloadToken(order.orderId),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
