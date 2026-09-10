import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { createDownloadToken } from "@/server/download-token";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  orderId: z.string().min(3, "Order ID is required").max(64),
  email: z.string().email("Enter the email you ordered with"),
});

/**
 * POST /api/downloads/request — re-issues a download link.
 *
 * The buyer proves ownership with the order ID *and* the email on the order,
 * so a guessed order ID alone gets nothing.
 */
export async function POST(request: NextRequest) {
  try {
    // Order id + email is a guessable pair given enough attempts, so cap them.
    const limit = rateLimit(`downloads:${await clientIp()}`, 15, 10 * 60 * 1000);
    if (!limit.allowed) {
      return fail("Too many attempts. Please wait a few minutes and try again.", 429);
    }

    const body = requestSchema.parse(await request.json());

    await connectToDatabase();
    const order = await Order.findOne({
      orderId: body.orderId.trim().toUpperCase(),
      email: body.email.trim().toLowerCase(),
    })
      .lean()
      .exec();

    // One message for "no such order" and "wrong email" alike, so this cannot
    // be used to discover which order IDs exist.
    if (!order) {
      return fail("No order matches that ID and email.", 404);
    }

    const doc = order as Record<string, unknown>;
    const status = String(doc["status"] ?? "");
    if (!["Paid", "Delivered"].includes(status)) {
      return fail(
        status === "Refunded"
          ? "This order was refunded, so its files are no longer available."
          : "This order is not paid yet, so its files are not ready.",
        403,
      );
    }

    return ok({ token: createDownloadToken(String(doc["orderId"])) });
  } catch (error) {
    return handleRouteError(error);
  }
}
