import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { requireAdmin } from "@/server/require-admin";
import { createDownloadToken, DOWNLOAD_TTL_MS } from "@/server/download-token";
import { fail, handleRouteError, ok } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

/**
 * POST /api/orders/[orderId]/download-link — admin only.
 * Issues a fresh link so support can send a buyer their files again, without
 * the buyer having to remember which email they used.
 */
export async function POST(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { orderId } = await params;

    await connectToDatabase();
    const order = await Order.findOne({ orderId: orderId.toUpperCase() }).lean().exec();
    if (!order) return fail("Order not found.", 404);

    const doc = order as Record<string, unknown>;
    const status = String(doc["status"] ?? "");
    if (!["Paid", "Delivered"].includes(status)) {
      return fail(`This order is ${status.toLowerCase()}, so it has no downloads.`, 409);
    }

    const token = createDownloadToken(String(doc["orderId"]));
    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

    return ok({
      token,
      url: `${base}/api/downloads/${token}`,
      expiresAt: new Date(Date.now() + DOWNLOAD_TTL_MS).toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
