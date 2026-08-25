import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { requireAdmin } from "@/server/require-admin";
import { categorySeed, productSeed } from "@/server/seed-data";
import { handleRouteError, ok } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/seed — re-applies the starter catalogue from inside the admin panel.
 * Admin only, and upsert-based, so orders and support tickets are untouched.
 * The admin account itself is only ever created by `npm run seed`.
 */
export async function POST() {
  try {
    await requireAdmin();
    await connectToDatabase();

    const products = await Product.bulkWrite(
      productSeed.map((p) => ({
        updateOne: { filter: { slug: p.slug }, update: { $set: p }, upsert: true },
      })),
    );
    const categories = await Category.bulkWrite(
      categorySeed.map((c) => ({
        updateOne: { filter: { slug: c.slug }, update: { $set: c }, upsert: true },
      })),
    );

    return ok({
      products: { inserted: products.upsertedCount, updated: products.modifiedCount },
      categories: { inserted: categories.upsertedCount, updated: categories.modifiedCount },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
