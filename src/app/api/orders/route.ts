import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { requireAdmin } from "@/server/require-admin";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeOrder } from "@/server/serialize";

export const dynamic = "force-dynamic";

/** GET /api/orders — admin only. */
export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();
    const docs = await Order.find().sort({ createdAt: -1 }).limit(200).lean().exec();
    return ok(docs.map((d) => serializeOrder(d as Record<string, unknown>)));
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/orders — closed.
 *
 * This used to create a paid order straight from the browser, which meant
 * anyone who could call it received downloadable assets without paying. Orders
 * are now written only by the Stripe webhook, after payment is confirmed.
 * Checkout starts at POST /api/checkout.
 */
export async function POST() {
  return fail("Orders are created by the payment provider. Start checkout at /api/checkout.", 410);
}
