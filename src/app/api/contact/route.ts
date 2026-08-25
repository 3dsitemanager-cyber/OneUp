import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { requireAdmin } from "@/server/require-admin";
import { contactSchema } from "@/lib/validation";
import { handleRouteError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** POST /api/contact — stores a message from the /contact form. */
export async function POST(request: NextRequest) {
  try {
    const body = contactSchema.parse(await request.json());
    await connectToDatabase();
    const created = await ContactMessage.create({ ...body, email: body.email.toLowerCase() });
    return ok({ id: String(created._id), status: created.status }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** GET /api/contact — admin only. Inbox listing. */
export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();
    const docs = await ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean().exec();
    return ok(
      docs.map((d) => {
        const doc = d as Record<string, unknown>;
        return {
          id: String(doc["_id"]),
          name: String(doc["name"] ?? ""),
          email: String(doc["email"] ?? ""),
          subject: String(doc["subject"] ?? ""),
          message: String(doc["message"] ?? ""),
          status: String(doc["status"] ?? "New"),
          createdAt:
            doc["createdAt"] instanceof Date ? doc["createdAt"].toISOString() : String(doc["createdAt"] ?? ""),
        };
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
