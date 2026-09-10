import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { Order, type OrderDoc } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import type { PricedCart } from "@/server/pricing";

/** Lifetime-spend tiers, matching the enum on the Customer schema. */
const PLAN_TIERS = [
  { plan: "Studio", minSpend: 1000 },
  { plan: "Pro", minSpend: 250 },
  { plan: "Indie", minSpend: 0 },
] as const;

const planForSpend = (spend: number) =>
  PLAN_TIERS.find((t) => spend >= t.minSpend)?.plan ?? "Indie";

export type CreateOrderInput = {
  customerName: string;
  email: string;
  country: string;
  paymentMethod: "card" | "wallet" | "bank";
  cart: PricedCart;
  /** Stripe's session id — stored so a replayed webhook cannot double-charge. */
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
};

/**
 * Records a paid order, then rolls it up onto the customer and the assets.
 *
 * Idempotent by `stripeSessionId`: Stripe retries a webhook until it gets a
 * 2xx, and the same event can legitimately arrive twice, so a second call for
 * a session that already has an order returns the existing one untouched
 * rather than creating a duplicate or double-incrementing the counters.
 */
export async function createPaidOrder(input: CreateOrderInput): Promise<OrderDoc> {
  await connectToDatabase();

  if (input.stripeSessionId) {
    const existing = await Order.findOne({ stripeSessionId: input.stripeSessionId }).exec();
    if (existing) return existing;
  }

  const email = input.email.toLowerCase();
  const { items, subtotal, discount, total } = input.cart;

  const order = await Order.create({
    orderId: await generateOrderId(),
    customerName: input.customerName,
    email,
    country: input.country,
    paymentMethod: input.paymentMethod,
    items,
    subtotal,
    discount,
    total,
    status: "Paid",
    ...(input.stripeSessionId ? { stripeSessionId: input.stripeSessionId } : {}),
    ...(input.stripePaymentIntentId ? { stripePaymentIntentId: input.stripePaymentIntentId } : {}),
  });

  const slugs = items.map((i) => i.slug);
  const [customer] = await Promise.all([
    Customer.findOneAndUpdate(
      { email },
      {
        $inc: { orders: 1, spend: total },
        $set: { name: input.customerName, country: input.country },
      },
      { upsert: true, new: true },
    ).exec(),
    Product.updateMany({ slug: { $in: slugs } }, { $inc: { sales: 1 } }).exec(),
  ]);

  // The tier depends on the new lifetime total, so it is applied after the $inc.
  const plan = planForSpend(customer?.spend ?? total);
  if (customer && customer.plan !== plan) {
    await Customer.updateOne({ _id: customer._id }, { $set: { plan } }).exec();
  }

  return order;
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
