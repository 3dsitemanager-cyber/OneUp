import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { verifyDownloadToken } from "@/server/download-token";
import { createAssetDownloadUrl } from "@/server/uploads";
import { fail, handleRouteError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string; slug: string }> };

const DELIVERABLE = ["Paid", "Delivered"];

/**
 * GET /api/downloads/[token]/[slug] — hands over one purchased file.
 *
 * The signed Cloudinary URL is minted per request and expires in minutes, so
 * the long-lived token never turns into a permanently shareable file link.
 */
export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { token, slug } = await params;
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
    if (!DELIVERABLE.includes(String(doc["status"] ?? ""))) {
      return fail("This order's files are not available.", 403);
    }

    // The token grants THIS order only — never a product it did not buy.
    const items = Array.isArray(doc["items"]) ? (doc["items"] as Record<string, unknown>[]) : [];
    if (!items.some((i) => String(i["slug"]) === slug.toLowerCase())) {
      return fail("That file is not part of this order.", 403);
    }

    const product = await Product.findOne({ slug: slug.toLowerCase() })
      .select("+assetFile slug name")
      .lean()
      .exec();
    if (!product) return fail("Product not found.", 404);

    const asset = (product as Record<string, unknown>)["assetFile"] as
      | Record<string, unknown>
      | null
      | undefined;

    if (!asset?.["publicId"]) {
      return fail("No downloadable file has been attached to this product yet.", 404);
    }

    const url = createAssetDownloadUrl(
      String(asset["publicId"]),
      String(asset["format"] ?? "zip"),
      String(asset["resourceType"] ?? "raw"),
    );

    // 302 so the browser fetches straight from Cloudinary — the file never
    // passes through this server, so large archives cost us no bandwidth.
    return NextResponse.redirect(url, 302);
  } catch (error) {
    return handleRouteError(error);
  }
}
