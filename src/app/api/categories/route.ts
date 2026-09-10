import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { requireAdmin } from "@/server/require-admin";
import { categorySchema } from "@/lib/validation";
import { getCategories } from "@/server/queries";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeCategory } from "@/server/serialize";

export const dynamic = "force-dynamic";

/** Turns "Sci-Fi Props" into "sci-fi-props". */
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * GET /api/categories — every collection the admin has created.
 * `?withProducts=1` drops the empty ones, for menus that should never link to
 * an empty listing.
 */
export async function GET(request: NextRequest) {
  try {
    const onlyWithProducts = request.nextUrl.searchParams.get("withProducts") === "1";
    return ok(await getCategories({ onlyWithProducts }));
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/categories — admin only. Creates a collection. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = categorySchema.parse(await request.json());
    const slug = body.slug ?? slugify(body.name);

    await connectToDatabase();
    const clash = await Category.findOne({
      $or: [{ slug }, { name: body.name.trim() }],
    })
      .lean()
      .exec();
    if (clash) return fail("A category with that name already exists.", 409);

    const created = await Category.create({ ...body, slug, name: body.name.trim() });
    return ok(serializeCategory(created.toObject()), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
