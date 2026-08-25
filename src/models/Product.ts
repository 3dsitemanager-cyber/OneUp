import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { CATEGORY_NAMES } from "@/lib/types";

export { CATEGORY_NAMES };

const ProductSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: CATEGORY_NAMES, index: true },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    sales: { type: Number, default: 0, min: 0 },
    // NOT `isNew`: that is a reserved mongoose document flag and would be shadowed.
    isNewRelease: { type: Boolean, default: false },
    image: { type: String, required: true },
    gallery: { type: [String], default: [] },
    short: { type: String, required: true },
    description: { type: String, default: "" },
    formats: { type: [String], default: [] },
    polygons: { type: String, default: "" },
    textures: { type: String, default: "" },
    fileSize: { type: String, default: "" },
    software: { type: [String], default: [] },
    features: { type: [String], default: [] },
    published: { type: Boolean, default: true, index: true },
    // The downloadable archive delivered after purchase, stored in Cloudinary.
    // Never sent to the storefront — only the admin API and the (future)
    // post-payment delivery step read it.
    assetFile: {
      type: {
        url: String,
        publicId: String,
        resourceType: String,
        format: String,
        bytes: Number,
        originalFilename: String,
      },
      default: null,
      select: false,
      _id: false,
    },
  },
  { timestamps: true },
);

// Powers the search box on /models and the admin asset table.
ProductSchema.index({ name: "text", short: "text", description: "text" });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: mongoose.Types.ObjectId };

export const Product: Model<ProductDoc> =
  (mongoose.models["Product"] as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", ProductSchema);

export default Product;
