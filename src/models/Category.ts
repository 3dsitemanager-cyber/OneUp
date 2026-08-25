import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Marketing count shown on the category tiles — independent of live listings.
    count: { type: Number, default: 0, min: 0 },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: mongoose.Types.ObjectId };

export const Category: Model<CategoryDoc> =
  (mongoose.models["Category"] as Model<CategoryDoc>) ||
  mongoose.model<CategoryDoc>("Category", CategorySchema);

export default Category;
