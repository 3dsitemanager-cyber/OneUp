import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "Administrator", trim: true },
    // bcrypt hash — the plaintext password never touches the database.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin"], default: "admin" },
    lastLoginAt: { type: Date },

    // Per-account lockout. The IP rate limit is in-memory and per-instance, so
    // it resets on deploy and does nothing against a distributed attempt; this
    // survives both because it lives in the database with the account.
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

export type AdminUserDoc = InferSchemaType<typeof AdminUserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminUser: Model<AdminUserDoc> =
  (mongoose.models["AdminUser"] as Model<AdminUserDoc>) ||
  mongoose.model<AdminUserDoc>("AdminUser", AdminUserSchema);

export default AdminUser;
