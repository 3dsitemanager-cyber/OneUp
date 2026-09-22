import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { ContactMessage } from "@/models/ContactMessage";
import { Complaint } from "@/models/Complaint";
import { ORDER_STATUSES } from "@/lib/types";
import type {
  Category as CategoryType,
  Complaint as ComplaintType,
  ContactMessage as ContactMessageType,
  CustomerSummary,
  DashboardStats,
  Order as OrderType,
  Product as ProductType,
  TrendDelta,
} from "@/lib/types";
import {
  serializeCategory,
  serializeComplaint,
  serializeContactMessage,
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
  /** Trims the payload to what a card renders. Detail pages need the full doc. */
  listOnly?: boolean | undefined;
};

/**
 * Fields a product card actually renders.
 *
 * Listings were sending every document whole — description, features,
 * licenseTerms, highlights, licence copy — none of which a card shows. On a
 * catalogue of any size that is the difference between a small response and a
 * multi-megabyte one.
 */
const LIST_FIELDS =
  "slug name category price rating sales isNewRelease image short formats software createdAt";

/** Nothing sane asks for more than this in one response. */
const MAX_LIMIT = 200;

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
  if (query.listOnly) cursor.select(LIST_FIELDS);
  // Always bounded: an unbounded find over a growing catalogue is a slow query
  // waiting to happen, and nothing here paginates yet.
  cursor.limit(Math.min(query.limit ?? MAX_LIMIT, MAX_LIMIT));

  const docs = await cursor.lean().exec();
  return docs.map((d) => serializeProduct(d as Record<string, unknown>));
}

export async function getProductBySlug(slug: string): Promise<ProductType | null> {
  await connectToDatabase();
  const doc = await Product.findOne({ slug: slug.toLowerCase(), published: true }).lean().exec();
  return doc ? serializeProduct(doc as Record<string, unknown>) : null;
}

/**
 * Admin variant of getProductBySlug — deliberately skips the `published` filter
 * so a draft asset can still be opened in the editor.
 */
export async function getProductForAdmin(slug: string): Promise<ProductType | null> {
  await connectToDatabase();
  // +assetFile so editing a product does not silently drop its archive.
  const doc = await Product.findOne({ slug: slug.toLowerCase() })
    .select("+assetFile")
    .lean()
    .exec();
  return doc ? serializeProduct(doc as Record<string, unknown>) : null;
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductType[]> {
  await connectToDatabase();
  // These render as cards, so the prose fields would be fetched and discarded.
  const docs = await Product.find({ slug: { $ne: slug.toLowerCase() }, published: true })
    .select(LIST_FIELDS)
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

/**
 * Categories with their real published-product counts.
 *
 * `count` on the Category document is a marketing figure from the seed, so it
 * is replaced here by an actual tally. Pass `onlyWithProducts` for menus that
 * should not offer a category leading to an empty listing.
 */
export async function getCategories(
  { onlyWithProducts = false } = {},
): Promise<CategoryType[]> {
  await connectToDatabase();

  const [docs, tallies] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean().exec(),
    Product.aggregate<{ _id: string; count: number }>([
      { $match: { published: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]).exec(),
  ]);

  const byName = new Map(tallies.map((t) => [t._id, t.count]));

  const categories = docs.map((d) => {
    const category = serializeCategory(d as Record<string, unknown>);
    return { ...category, count: byName.get(category.name) ?? 0 };
  });

  return onlyWithProducts ? categories.filter((c) => c.count > 0) : categories;
}

export async function getOrders(limit = 200): Promise<OrderType[]> {
  await connectToDatabase();
  const docs = await Order.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  return docs.map((d) => serializeOrder(d as Record<string, unknown>));
}

/** Admin catalogue listing — includes unpublished drafts, newest first. */
export async function getProductsForAdmin(limit = 200): Promise<ProductType[]> {
  await connectToDatabase();
  // +assetFile so the table can flag products with nothing to deliver.
  const docs = await Product.find()
    .select("+assetFile")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
  return docs.map((d) => serializeProduct(d as Record<string, unknown>));
}

export async function getContactMessages(limit = 200): Promise<ContactMessageType[]> {
  await connectToDatabase();
  const docs = await ContactMessage.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  return docs.map((d) => serializeContactMessage(d as Record<string, unknown>));
}

export async function getComplaints(limit = 200): Promise<ComplaintType[]> {
  await connectToDatabase();
  const docs = await Complaint.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  return docs.map((d) => serializeComplaint(d as Record<string, unknown>));
}

export async function getCustomers(limit = 200): Promise<CustomerSummary[]> {
  await connectToDatabase();
  const docs = await Customer.find().sort({ spend: -1 }).limit(limit).lean().exec();
  return docs.map((d) => serializeCustomer(d as Record<string, unknown>));
}

/** Rolling window used by the dashboard trend line and every delta. */
const TREND_DAYS = 30;

/** Midnight UTC, `daysAgo` days back — the bucket boundary the $dateTrunc uses. */
function startOfDayUTC(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

/** Percent change, or null when there is no baseline to divide by. */
function delta(current: number, previous: number): TrendDelta {
  const changePct =
    previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;
  return { current, previous, changePct };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectToDatabase();

  // Refunded orders never count toward revenue anywhere on the dashboard.
  const earning = { status: { $ne: "Refunded" } };
  const windowStart = startOfDayUTC(TREND_DAYS - 1);
  const priorStart = startOfDayUTC(TREND_DAYS * 2 - 1);

  const [
    products,
    orderAgg,
    orderCount,
    unreadMessages,
    openComplaints,
    dailyAgg,
    categoryAgg,
    statusAgg,
    paymentAgg,
    windowAgg,
  ] = await Promise.all([
    // Catalogue totals and the top-earning list, computed in Mongo rather than
    // by pulling every product back to add up here. `top` is already ranked by
    // earnings, so the page does not re-sort it.
    Product.aggregate<{
      totals: { liveAssets: number; downloads: number; catalogueRevenue: number }[];
      top: { slug: string; name: string; value: number }[];
    }>([
      { $match: { published: true } },
      { $addFields: { earned: { $multiply: ["$price", "$sales"] } } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                liveAssets: { $sum: 1 },
                downloads: { $sum: "$sales" },
                catalogueRevenue: { $sum: "$earned" },
              },
            },
          ],
          top: [
            { $sort: { earned: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, slug: 1, name: 1, value: "$earned" } },
          ],
        },
      },
    ]).exec(),
    Order.aggregate<{ _id: null; revenue: number }>([
      { $match: earning },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]).exec(),
    Order.countDocuments().exec(),
    ContactMessage.countDocuments({ status: "New" }).exec(),
    Complaint.countDocuments({ status: { $ne: "Resolved" } }).exec(),

    // One bucket per calendar day (UTC) across the trend window.
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { ...earning, createdAt: { $gte: windowStart } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
    ]).exec(),

    // Revenue by category, summed over the line items rather than the order total.
    Order.aggregate<{ _id: string; revenue: number; units: number }>([
      { $match: earning },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $ifNull: ["$items.category", "Uncategorised"] },
          revenue: { $sum: "$items.price" },
          units: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]).exec(),

    Order.aggregate<{ _id: string; count: number; total: number }>([
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
    ]).exec(),

    Order.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
    ]).exec(),

    // Current vs preceding window, in one pass, for the headline deltas.
    Order.aggregate<{ _id: string; revenue: number; orders: number; customers: string[] }>([
      { $match: { ...earning, createdAt: { $gte: priorStart } } },
      {
        $group: {
          _id: {
            $cond: [{ $gte: ["$createdAt", windowStart] }, "current", "previous"],
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          customers: { $addToSet: "$email" },
        },
      },
    ]).exec(),
  ]);

  // $facet always returns one element; an empty catalogue leaves its arrays empty.
  const facet = products[0];
  const totals = facet?.totals?.[0] ?? { liveAssets: 0, downloads: 0, catalogueRevenue: 0 };
  const topAssets = facet?.top ?? [];

  const liveRevenue = orderAgg[0]?.revenue ?? 0;

  // Days with no orders are absent from the aggregation but must still be
  // plotted, otherwise the line silently closes the gap over quiet days.
  const byDay = new Map(dailyAgg.map((d) => [d._id, d]));
  const revenueSeries = Array.from({ length: TREND_DAYS }, (_, i) => {
    const key = startOfDayUTC(TREND_DAYS - 1 - i).toISOString().slice(0, 10);
    const hit = byDay.get(key);
    return { date: key, revenue: hit?.revenue ?? 0, orders: hit?.orders ?? 0 };
  });

  const current = windowAgg.find((w) => w._id === "current");
  const previous = windowAgg.find((w) => w._id === "previous");
  const currentRevenue = current?.revenue ?? 0;
  const previousRevenue = previous?.revenue ?? 0;
  const currentOrders = current?.orders ?? 0;
  const previousOrders = previous?.orders ?? 0;
  const aov = (revenue: number, orders: number) =>
    orders > 0 ? Math.round((revenue / orders) * 100) / 100 : 0;

  return {
    // Real order revenue once orders exist; otherwise fall back to catalogue value
    // so a freshly seeded dashboard is not a wall of zeros.
    revenue: liveRevenue > 0 ? liveRevenue : totals.catalogueRevenue,
    downloads: totals.downloads,
    liveAssets: totals.liveAssets,
    orderCount,
    unreadMessages,
    openComplaints,
    // Already ranked and capped by the aggregation.
    topAssets,

    revenueSeries,
    categorySplit: categoryAgg.map((c) => ({
      category: c._id || "Uncategorised",
      revenue: c.revenue,
      units: c.units,
    })),
    // Ordered by the lifecycle, not by count, so the bar reads Pending → Refunded.
    statusSplit: ORDER_STATUSES.map((status) => {
      const hit = statusAgg.find((s) => s._id === status);
      return { status, count: hit?.count ?? 0, total: hit?.total ?? 0 };
    }),
    paymentSplit: paymentAgg
      .map((p) => ({ method: p._id || "card", count: p.count }))
      .sort((a, b) => b.count - a.count),
    trends: {
      revenue: delta(currentRevenue, previousRevenue),
      orders: delta(currentOrders, previousOrders),
      customers: delta(current?.customers.length ?? 0, previous?.customers.length ?? 0),
      avgOrderValue: delta(
        aov(currentRevenue, currentOrders),
        aov(previousRevenue, previousOrders),
      ),
    },
  };
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
