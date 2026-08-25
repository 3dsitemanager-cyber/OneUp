import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { getProducts } from "@/server/queries";
import { requireAdmin } from "@/server/require-admin";
import { productQuerySchema, productSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeProduct } from "@/server/serialize";

export const dynamic = "force-dynamic";

/** GET /api/products — public catalogue with filtering and sorting. */
export async function GET(request: NextRequest) {
  try {
    const query = productQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const products = await getProducts(query);
    return ok(products);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/products — admin only. Creates a new listing. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = productSchema.parse(await request.json());

    await connectToDatabase();
    const existing = await Product.exists({ slug: body.slug });
    if (existing) return fail("A product with that slug already exists.", 409);

    const created = await Product.create(body);
    return ok(serializeProduct(created.toObject()), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
