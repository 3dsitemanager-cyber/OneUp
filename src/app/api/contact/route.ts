import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { requireAdmin } from "@/server/require-admin";
import { contactSchema } from "@/lib/validation";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { serializeContactMessage } from "@/server/serialize";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

/** POST /api/contact — stores a message from the /contact form. */
export async function POST(request: NextRequest) {
  try {
    // An open write endpoint: capped so the admin inbox cannot be flooded.
    const limit = rateLimit(`contact:${await clientIp()}`, 5, 10 * 60 * 1000);
    if (!limit.allowed) {
      return fail("You've sent several messages already. Please wait a few minutes.", 429);
    }

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
    return ok(docs.map((d) => serializeContactMessage(d as Record<string, unknown>)));
  } catch (error) {
    return handleRouteError(error);
  }
}
