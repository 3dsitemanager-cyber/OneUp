import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { requireAdmin } from "@/server/require-admin";
import { categoryUpdateSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeCategory } from "@/server/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * PATCH /api/categories/[slug] — admin only.
 * Products store the category by name, so a rename has to carry every product
 * across with it, otherwise they would silently point at a category that no
 * longer exists.
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const patch = categoryUpdateSchema.parse(await request.json());

    await connectToDatabase();
    const existing = await Category.findOne({ slug: slug.toLowerCase() }).exec();
    if (!existing) return fail("Category not found.", 404);

    const nextName = patch.name?.trim();
    if (nextName && nextName !== existing.name) {
      const clash = await Category.findOne({ name: nextName, _id: { $ne: existing._id } })
        .lean()
        .exec();
      if (clash) return fail("Another category already uses that name.", 409);
    }

    const updated = await Category.findByIdAndUpdate(
      existing._id,
      { $set: { ...patch, ...(nextName ? { name: nextName } : {}) } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (nextName && nextName !== existing.name) {
      await Product.updateMany({ category: existing.name }, { $set: { category: nextName } }).exec();
    }

    return ok(serializeCategory(updated as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/categories/[slug] — admin only.
 * Refused while products still reference it, so deleting a category can never
 * strand a listing in a category that no longer exists.
 */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { slug } = await params;

    await connectToDatabase();
    const existing = await Category.findOne({ slug: slug.toLowerCase() }).exec();
    if (!existing) return fail("Category not found.", 404);

    const inUse = await Product.countDocuments({ category: existing.name }).exec();
    if (inUse > 0) {
      return fail(
        `${inUse} ${inUse === 1 ? "product uses" : "products use"} this category. Move them first, then delete it.`,
        409,
      );
    }

    await Category.deleteOne({ _id: existing._id }).exec();
    return ok({ slug: slug.toLowerCase(), deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
