import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Complaint } from "@/models/Complaint";
import { requireAdmin } from "@/server/require-admin";
import { complaintSchema } from "@/lib/validation";
import { handleRouteError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** POST /api/complaints — stores a support ticket from the /complaint form. */
export async function POST(request: NextRequest) {
  try {
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
    return ok(
      docs.map((d) => {
        const doc = d as Record<string, unknown>;
        return {
          id: String(doc["_id"]),
          orderId: String(doc["orderId"] ?? ""),
          email: String(doc["email"] ?? ""),
          product: String(doc["product"] ?? ""),
          type: String(doc["type"] ?? "Other"),
          description: String(doc["description"] ?? ""),
          status: String(doc["status"] ?? "Open"),
          attachment: doc["attachment"] ?? null,
          createdAt:
            doc["createdAt"] instanceof Date ? doc["createdAt"].toISOString() : String(doc["createdAt"] ?? ""),
        };
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
