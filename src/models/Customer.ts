import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    country: { type: String, default: "" },
    plan: { type: String, enum: ["Indie", "Pro", "Studio"], default: "Indie" },
    // Rolled up on every completed checkout so the admin list stays a single query.
    orders: { type: Number, default: 0, min: 0 },
    spend: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// The admin list is ordered by lifetime spend.
CustomerSchema.index({ spend: -1 });

export type CustomerDoc = InferSchemaType<typeof CustomerSchema> & { _id: mongoose.Types.ObjectId };

export const Customer: Model<CustomerDoc> =
  (mongoose.models["Customer"] as Model<CustomerDoc>) ||
  mongoose.model<CustomerDoc>("Customer", CustomerSchema);

export default Customer;
