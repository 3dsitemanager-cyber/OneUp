import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { ORDER_STATUSES } from "@/lib/types";

export { ORDER_STATUSES };

const OrderItemSchema = new Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    image: { type: String, default: "" },
    // Price is copied at purchase time so later catalogue edits never rewrite history.
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    country: { type: String, default: "" },
    items: { type: [OrderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["card", "wallet", "bank"], default: "card" },
    status: { type: String, enum: ORDER_STATUSES, default: "Paid", index: true },
    // Stripe's ids for this purchase. `sparse` so orders created outside Stripe
    // (seeds, manual entries) don't all collide on a null unique key; `unique`
    // so a replayed webhook can never write the same session twice.
    stripeSessionId: { type: String, index: true, unique: true, sparse: true },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
  },
  { timestamps: true },
);

// Every admin listing and the dashboard's revenue windows sort or range over
// createdAt; without this each one is a collection scan plus an in-memory sort.
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId };

export const Order: Model<OrderDoc> =
  (mongoose.models["Order"] as Model<OrderDoc>) || mongoose.model<OrderDoc>("Order", OrderSchema);

export default Order;
