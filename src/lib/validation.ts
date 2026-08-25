import { z } from "zod";
import { CATEGORY_NAMES, COMPLAINT_TYPES, ORDER_STATUSES } from "@/lib/types";

// The admin identifier is a plain username, not an email address — the account
// is provisioned from ADMIN_EMAIL in .env.local rather than by self sign-up.
export const adminLoginSchema = z.object({
  email: z.string().min(2, "Username is required").max(160),
  password: z.string().min(1, "Password is required"),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name is too short").max(120),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(2, "Subject is too short").max(200),
  message: z.string().min(10, "Please add a few more details").max(5000),
});

/** A file already stored in Cloudinary, referenced by a form submission. */
export const storedFileSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1).max(300),
  resourceType: z.string().max(20).default("raw"),
  format: z.string().max(20).default(""),
  bytes: z.number().int().nonnegative().default(0),
  originalFilename: z.string().max(255).default(""),
});

export const complaintSchema = z.object({
  orderId: z.string().min(3, "Order ID is required").max(64),
  email: z.string().email("Enter a valid email address"),
  product: z.string().max(200).optional().default(""),
  type: z.enum(COMPLAINT_TYPES).default("Other"),
  description: z.string().min(10, "Please describe the issue").max(5000),
  attachment: storedFileSchema.nullish(),
});

export const orderItemSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().default(""),
  image: z.string().default(""),
  price: z.number().nonnegative(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Name is too short").max(120),
  email: z.string().email("Enter a valid email address"),
  country: z.string().max(80).optional().default(""),
  paymentMethod: z.enum(["card", "wallet", "bank"]).default("card"),
  items: z.array(orderItemSchema).min(1, "Your cart is empty"),
});

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const productSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
  name: z.string().min(2).max(160),
  category: z.enum(CATEGORY_NAMES),
  price: z.number().nonnegative(),
  rating: z.number().min(0).max(5).default(0),
  sales: z.number().int().nonnegative().default(0),
  // Field name matches the mongoose schema; the API serialises it back as `isNew`.
  isNewRelease: z.boolean().default(false),
  image: z.string().min(1),
  gallery: z.array(z.string()).default([]),
  short: z.string().min(5).max(400),
  description: z.string().max(5000).default(""),
  formats: z.array(z.string()).default([]),
  polygons: z.string().max(80).default(""),
  textures: z.string().max(80).default(""),
  fileSize: z.string().max(40).default(""),
  software: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  published: z.boolean().default(true),
  assetFile: storedFileSchema.nullish(),
});

export const productUpdateSchema = productSchema.partial().omit({ slug: true });

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  format: z.string().optional(),
  sort: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
