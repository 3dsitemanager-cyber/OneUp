import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { requireAdmin } from "@/server/require-admin";
import { productUpdateSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeProduct } from "@/server/serialize";

export const dynamic = "force-dynamic";

// Next 15+ hands route params in as a promise.
type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    await connectToDatabase();
    const doc = await Product.findOne({ slug: slug.toLowerCase() }).lean().exec();
    if (!doc) return fail("Product not found.", 404);
    return ok(serializeProduct(doc as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const patch = productUpdateSchema.parse(await request.json());

    await connectToDatabase();
    const doc = await Product.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      { $set: patch },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!doc) return fail("Product not found.", 404);
    return ok(serializeProduct(doc as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { slug } = await params;

    await connectToDatabase();
    const result = await Product.deleteOne({ slug: slug.toLowerCase() }).exec();
    if (result.deletedCount === 0) return fail("Product not found.", 404);
    return ok({ slug: slug.toLowerCase(), deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
