import { getCustomers } from "@/server/queries";
import { requireAdmin } from "@/server/require-admin";
import { handleRouteError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET /api/customers — admin only. */
export async function GET() {
  try {
    await requireAdmin();
    return ok(await getCustomers());
  } catch (error) {
    return handleRouteError(error);
  }
}
