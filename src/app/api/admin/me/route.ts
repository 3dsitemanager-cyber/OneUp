import { getAdminSession } from "@/server/require-admin";
import { fail, handleRouteError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET /api/admin/me — who is signed in, if anyone. */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return fail("Not signed in.", 401);
    return ok({ email: session.email, name: session.name, role: session.role });
  } catch (error) {
    return handleRouteError(error);
  }
}
