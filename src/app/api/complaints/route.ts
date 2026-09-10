import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Complaint } from "@/models/Complaint";
import { requireAdmin } from "@/server/require-admin";
import { complaintSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeComplaint } from "@/server/serialize";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

/** POST /api/complaints — stores a support ticket from the /complaint form. */
export async function POST(request: NextRequest) {
  try {
    // An open write endpoint: capped so the support queue cannot be flooded.
    const limit = rateLimit(`complaints:${await clientIp()}`, 5, 10 * 60 * 1000);
    if (!limit.allowed) {
      return fail("You've submitted several reports already. Please wait a few minutes.", 429);
    }

    const body = complaintSchema.parse(await request.json());
    await connectToDatabase();
    const created = await Complaint.create({
      ...body,
      email: body.email.toLowerCase(),
      orderId: body.orderId.toUpperCase(),
      attachment: body.attachment ?? null,
    });
    return ok({ id: String(created._id), status: created.status }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** GET /api/complaints — admin only. */
export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();
    const docs = await Complaint.find().sort({ createdAt: -1 }).limit(200).lean().exec();
    return ok(docs.map((d) => serializeComplaint(d as Record<string, unknown>)));
  } catch (error) {
    return handleRouteError(error);
  }
}
