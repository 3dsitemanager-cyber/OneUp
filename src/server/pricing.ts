import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";

/** Cart lines of 3 or more take 10% off — mirrored from the cart/checkout UI. */
export const BULK_DISCOUNT_THRESHOLD = 3;
export const BULK_DISCOUNT_RATE = 0.1;

export type PricedItem = {
  slug: string;
  name: string;
  category: string;
  image: string;
  price: number;
};

export type PricedCart = {
  items: PricedItem[];
  subtotal: number;
  discount: number;
  total: number;
};

export class CartPricingError extends Error {}

/**
 * Re-prices a cart from the catalogue.
 *
 * The browser's prices are never trusted: only the slugs are taken from the
 * request, and every figure that reaches Stripe or an Order comes from
 * MongoDB. Both the checkout session and the webhook price through here, so a
 * tampered cart cannot buy a $60 asset for $1.
 */
export async function priceCart(slugsInput: string[]): Promise<PricedCart> {
  const slugs = [...new Set(slugsInput.map((s) => s.toLowerCase()))];
  if (slugs.length === 0) throw new CartPricingError("Your cart is empty.");

  await connectToDatabase();
  const docs = await Product.find({ slug: { $in: slugs }, published: true })
    .select("slug name category image price")
    .lean()
    .exec();

  if (docs.length !== slugs.length) {
    throw new CartPricingError("One or more items are no longer available. Please refresh your cart.");
  }

  const items: PricedItem[] = docs.map((d) => {
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

  return { items, subtotal, discount, total };
}
