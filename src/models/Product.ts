import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProductSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    // Free text, matched by name against the Category collection. Deliberately
    // NOT an enum: categories are admin-managed, so a fixed list here would
    // reject every new category the moment it was created.
    category: { type: String, required: true, trim: true, index: true },
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
    // Detail-page copy that used to be hardcoded in the component.
    highlights: { type: [String], default: [] },
    license: { type: String, default: "Standard commercial" },
    licenseTerms: { type: String, default: "" },
    delivery: { type: String, default: "Instant secure download" },
    uvs: { type: String, default: "" },
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

/**
 * Compound indexes matching how the storefront actually queries.
 *
 * Every listing filters on `published` first, then sorts. Without these, Mongo
 * filters on the single-field index and then sorts the result set in memory —
 * fine for a handful of products, a slow query once the catalogue grows.
 *
 * Note there is no text index: getProducts uses a case-insensitive regex so
 * partial words match while typing, and $text cannot serve that. A text index
 * here would cost write time and never be used.
 */
ProductSchema.index({ published: 1, category: 1, sales: -1, rating: -1 });
ProductSchema.index({ published: 1, sales: -1 });
ProductSchema.index({ published: 1, price: 1 });
ProductSchema.index({ published: 1, isNewRelease: -1, createdAt: -1 });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: mongoose.Types.ObjectId };

export const Product: Model<ProductDoc> =
  (mongoose.models["Product"] as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", ProductSchema);

export default Product;
