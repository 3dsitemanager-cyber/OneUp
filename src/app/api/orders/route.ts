import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { requireAdmin } from "@/server/require-admin";
import { createOrderSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeOrder } from "@/server/serialize";

export const dynamic = "force-dynamic";

/** Cart lines of 3 or more take 10% off — mirrored from the cart/checkout UI. */
const BULK_DISCOUNT_THRESHOLD = 3;
const BULK_DISCOUNT_RATE = 0.1;

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

/** POST /api/orders — public checkout. */
export async function POST(request: NextRequest) {
  try {
    const body = createOrderSchema.parse(await request.json());
    await connectToDatabase();

    // Never trust prices from the browser: re-read every line from the catalogue.
    const slugs = [...new Set(body.items.map((i) => i.slug.toLowerCase()))];
    const docs = await Product.find({ slug: { $in: slugs }, published: true })
      .select("slug name category image price")
      .lean()
      .exec();

    if (docs.length !== slugs.length) {
      return fail("One or more items are no longer available. Please refresh your cart.", 409);
    }

    const items = docs.map((d) => {
      const doc = d as Record<string, unknown>;
      return {
        slug: String(doc["slug"]),
        name: String(doc["name"]),
        category: String(doc["category"] ?? ""),
        image: String(doc["image"] ?? ""),
        price: typeof doc["price"] === "number" ? doc["price"] : 0,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.price, 0);
    const discount =
      items.length >= BULK_DISCOUNT_THRESHOLD
        ? Math.round(subtotal * BULK_DISCOUNT_RATE * 100) / 100
        : 0;
    const total = Math.round((subtotal - discount) * 100) / 100;

    const order = await Order.create({
      orderId: await generateOrderId(),
      customerName: body.customerName,
      email: body.email.toLowerCase(),
      country: body.country,
      paymentMethod: body.paymentMethod,
      items,
      subtotal,
      discount,
      total,
      status: "Paid",
    });

    // Roll the purchase up onto the customer record and the assets' sales counters.
    await Promise.all([
      Customer.updateOne(
        { email: body.email.toLowerCase() },
        {
          $inc: { orders: 1, spend: total },
          $setOnInsert: { name: body.customerName, country: body.country, plan: "Indie" },
        },
        { upsert: true },
      ).exec(),
      Product.updateMany({ slug: { $in: slugs } }, { $inc: { sales: 1 } }).exec(),
    ]);

    return ok(serializeOrder(order.toObject()), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function generateOrderId(): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike chars
  for (let attempt = 0; attempt < 5; attempt++) {
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const candidate = `VU-${suffix}`;
    if (!(await Order.exists({ orderId: candidate }))) return candidate;
  }
  // Fall back to something guaranteed unique rather than failing the checkout.
  return `VU-${Date.now().toString(36).toUpperCase()}`;
}
