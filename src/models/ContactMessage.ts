import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["New", "Read", "Replied"], default: "New", index: true },
  },
  { timestamps: true },
);

// Newest-first is how the inbox is always read.
ContactMessageSchema.index({ createdAt: -1 });

export type ContactMessageDoc = InferSchemaType<typeof ContactMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ContactMessage: Model<ContactMessageDoc> =
  (mongoose.models["ContactMessage"] as Model<ContactMessageDoc>) ||
  mongoose.model<ContactMessageDoc>("ContactMessage", ContactMessageSchema);

export default ContactMessage;
