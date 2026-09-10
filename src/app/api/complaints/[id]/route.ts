import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Complaint } from "@/models/Complaint";
import { requireAdmin } from "@/server/require-admin";
import { updateComplaintSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeComplaint } from "@/server/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/complaints/[id] — admin only. Moves a ticket through Open → In Review → Resolved. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Complaint not found.", 404);

    const { status } = updateComplaintSchema.parse(await request.json());

    await connectToDatabase();
    const doc = await Complaint.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!doc) return fail("Complaint not found.", 404);
    return ok(serializeComplaint(doc as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/complaints/[id] — admin only. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Complaint not found.", 404);

    await connectToDatabase();
    const result = await Complaint.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) return fail("Complaint not found.", 404);
    return ok({ id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
