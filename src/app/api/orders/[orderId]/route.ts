import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { requireAdmin } from "@/server/require-admin";
import { updateOrderSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeOrder } from "@/server/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

/**
 * GET /api/orders/VU-XXXXXX — admin only.
 *
 * Was public, which leaked a customer's name, email, country and purchase
 * history to anyone who guessed a six-character order id. Buyers reach their
 * own order through POST /api/downloads/request, which also requires the email
 * the order was placed with.
 */
export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { orderId } = await params;
    await connectToDatabase();
    const doc = await Order.findOne({ orderId: orderId.toUpperCase() }).lean().exec();
    if (!doc) return fail("Order not found.", 404);
    return ok(serializeOrder(doc as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/orders/VU-XXXXXX — admin only. Moves an order through its statuses. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { orderId } = await params;
    const { status } = updateOrderSchema.parse(await request.json());

    await connectToDatabase();
    const doc = await Order.findOneAndUpdate(
      { orderId: orderId.toUpperCase() },
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!doc) return fail("Order not found.", 404);
    return ok(serializeOrder(doc as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(error);
  }
}
