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
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId };

export const Order: Model<OrderDoc> =
  (mongoose.models["Order"] as Model<OrderDoc>) || mongoose.model<OrderDoc>("Order", OrderSchema);

export default Order;
