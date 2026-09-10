import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { verifyDownloadToken } from "@/server/download-token";
import { fail, handleRouteError, ok } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/** Statuses whose files a buyer is allowed to download. */
const DELIVERABLE = ["Paid", "Delivered"];

/**
 * GET /api/downloads/[token] — lists the files a paid order can download.
 *
 * The token itself is the authorisation, so no session is required: the buyer
 * follows the link from their confirmation page or receipt.
 */
export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { token } = await params;
    const verified = verifyDownloadToken(token);

    if (!verified.ok) {
      return verified.reason === "expired"
        ? fail("This download link has expired. Please request a new one.", 410)
        : fail("This download link is not valid.", 403);
    }

    await connectToDatabase();
    const order = await Order.findOne({ orderId: verified.orderId }).lean().exec();
    if (!order) return fail("Order not found.", 404);

    const doc = order as Record<string, unknown>;
    const status = String(doc["status"] ?? "");
    if (!DELIVERABLE.includes(status)) {
      return fail(
        status === "Refunded"
          ? "This order was refunded, so its files are no longer available."
          : "This order is not paid yet, so its files are not ready.",
        403,
      );
    }

    const items = Array.isArray(doc["items"]) ? (doc["items"] as Record<string, unknown>[]) : [];
    const slugs = items.map((i) => String(i["slug"]));

    // assetFile is `select: false` on the schema, so it must be asked for.
    const products = await Product.find({ slug: { $in: slugs } })
      .select("+assetFile slug name image")
      .lean()
      .exec();

    const files = products.map((p) => {
      const prod = p as Record<string, unknown>;
      const asset = prod["assetFile"] as Record<string, unknown> | null | undefined;
      return {
        slug: String(prod["slug"]),
        name: String(prod["name"]),
        image: String(prod["image"] ?? ""),
        // The URL is never exposed here — only whether a file exists. The
        // signed link is minted per click by the /file route below.
        available: Boolean(asset && asset["publicId"]),
        sizeBytes: asset && typeof asset["bytes"] === "number" ? (asset["bytes"] as number) : 0,
        format: asset ? String(asset["format"] ?? "") : "",
      };
    });

    return ok({
      orderId: verified.orderId,
      status,
      files,
      // True when the admin has not attached archives yet.
      pending: files.every((f) => !f.available),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
