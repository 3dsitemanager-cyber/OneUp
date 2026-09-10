import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { COMPLAINT_TYPES } from "@/lib/types";

export { COMPLAINT_TYPES };

const ComplaintSchema = new Schema(
  {
    orderId: { type: String, required: true, uppercase: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    product: { type: String, default: "" },
    type: { type: String, enum: COMPLAINT_TYPES, default: "Other" },
    description: { type: String, required: true },
    // Optional screenshot / log file the customer attached, stored in Cloudinary.
    attachment: {
      type: {
        url: String,
        publicId: String,
        resourceType: String,
        format: String,
        bytes: Number,
        originalFilename: String,
      },
      default: null,
      _id: false,
    },
    status: { type: String, enum: ["Open", "In Review", "Resolved"], default: "Open", index: true },
  },
  { timestamps: true },
);

// Newest-first is how the support queue is always read.
ComplaintSchema.index({ createdAt: -1 });

export type ComplaintDoc = InferSchemaType<typeof ComplaintSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Complaint: Model<ComplaintDoc> =
  (mongoose.models["Complaint"] as Model<ComplaintDoc>) ||
  mongoose.model<ComplaintDoc>("Complaint", ComplaintSchema);

export default Complaint;
