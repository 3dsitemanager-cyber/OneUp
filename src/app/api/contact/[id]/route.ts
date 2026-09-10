import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { requireAdmin } from "@/server/require-admin";
import { updateContactSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeContactMessage } from "@/server/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/contact/[id] — admin only. Moves a message through New → Read → Replied. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Message not found.", 404);

    const { status } = updateContactSchema.parse(await request.json());

    await connectToDatabase();
    const doc = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!doc) return fail("Message not found.", 404);
    return ok(serializeContactMessage(doc as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/contact/[id] — admin only. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Message not found.", 404);

    await connectToDatabase();
    const result = await ContactMessage.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) return fail("Message not found.", 404);
    return ok({ id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
