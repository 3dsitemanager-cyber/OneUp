import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import type {
  Category as CategoryType,
  CustomerSummary,
  DashboardStats,
  Order as OrderType,
  Product as ProductType,
} from "@/lib/types";
import {
  serializeCategory,
  serializeCustomer,
  serializeOrder,
  serializeProduct,
} from "@/server/serialize";

export type ProductQuery = {
  category?: string | undefined;
  search?: string | undefined;
  maxPrice?: number | undefined;
  minRating?: number | undefined;
  format?: string | undefined;
  sort?: string | undefined;
  limit?: number | undefined;
};

const SORTS: Record<string, Record<string, 1 | -1>> = {
  Featured: { sales: -1, rating: -1 },
  Newest: { isNewRelease: -1, createdAt: -1 },
  "Price Low → High": { price: 1 },
  "Price High → Low": { price: -1 },
  "Best Selling": { sales: -1 },
};

export async function getProducts(query: ProductQuery = {}): Promise<ProductType[]> {
  await connectToDatabase();

  const filter: Record<string, unknown> = { published: true };

  if (query.category && query.category !== "All") filter["category"] = query.category;
  if (typeof query.maxPrice === "number") filter["price"] = { $lte: query.maxPrice };
  if (typeof query.minRating === "number" && query.minRating > 0) {
    filter["rating"] = { $gte: query.minRating };
  }
  if (query.format) filter["formats"] = query.format;
  if (query.search?.trim()) {
    // Regex rather than $text so partial words ("cyb") still match while typing.
    const rx = new RegExp(escapeRegex(query.search.trim()), "i");
    filter["$or"] = [{ name: rx }, { short: rx }, { description: rx }];
  }

  const cursor = Product.find(filter).sort(SORTS[query.sort ?? "Featured"] ?? SORTS["Featured"]!);
  if (query.limit) cursor.limit(query.limit);

  const docs = await cursor.lean().exec();
  return docs.map((d) => serializeProduct(d as Record<string, unknown>));
}

export async function getProductBySlug(slug: string): Promise<ProductType | null> {
  await connectToDatabase();
  const doc = await Product.findOne({ slug: slug.toLowerCase(), published: true }).lean().exec();
  return doc ? serializeProduct(doc as Record<string, unknown>) : null;
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductType[]> {
  await connectToDatabase();
  const docs = await Product.find({ slug: { $ne: slug.toLowerCase() }, published: true })
    .sort({ sales: -1 })
    .limit(limit)
    .lean()
    .exec();
  return docs.map((d) => serializeProduct(d as Record<string, unknown>));
}

export async function getAllProductSlugs(): Promise<string[]> {
  await connectToDatabase();
  const docs = await Product.find({ published: true }).select("slug").lean().exec();
  return docs.map((d) => String((d as Record<string, unknown>)["slug"]));
}

export async function getCategories(): Promise<CategoryType[]> {
  await connectToDatabase();
  const docs = await Category.find().sort({ order: 1, name: 1 }).lean().exec();
  return docs.map((d) => serializeCategory(d as Record<string, unknown>));
}

export async function getOrders(limit = 200): Promise<OrderType[]> {
  await connectToDatabase();
  const docs = await Order.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  return docs.map((d) => serializeOrder(d as Record<string, unknown>));
}

export async function getCustomers(limit = 200): Promise<CustomerSummary[]> {
  await connectToDatabase();
  const docs = await Customer.find().sort({ spend: -1 }).limit(limit).lean().exec();
  return docs.map((d) => serializeCustomer(d as Record<string, unknown>));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectToDatabase();

  const [products, orderAgg, orderCount] = await Promise.all([
    Product.find({ published: true }).select("slug name price sales").lean().exec(),
    Order.aggregate<{ _id: null; revenue: number }>([
      { $match: { status: { $ne: "Refunded" } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]).exec(),
    Order.countDocuments().exec(),
  ]);

  const rows = products.map((p) => {
    const doc = p as Record<string, unknown>;
    const price = typeof doc["price"] === "number" ? doc["price"] : 0;
    const sales = typeof doc["sales"] === "number" ? doc["sales"] : 0;
    return { slug: String(doc["slug"]), name: String(doc["name"]), value: price * sales, sales };
  });

  const catalogueRevenue = rows.reduce((sum, r) => sum + r.value, 0);
  const liveRevenue = orderAgg[0]?.revenue ?? 0;

  return {
    // Real order revenue once orders exist; otherwise fall back to catalogue value
    // so a freshly seeded dashboard is not a wall of zeros.
    revenue: liveRevenue > 0 ? liveRevenue : catalogueRevenue,
    downloads: rows.reduce((sum, r) => sum + r.sales, 0),
    liveAssets: rows.length,
    orderCount,
    topAssets: [...rows]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(({ slug, name, value }) => ({ slug, name, value })),
  };
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
