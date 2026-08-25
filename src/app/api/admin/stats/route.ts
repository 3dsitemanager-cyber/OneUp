import { getDashboardStats } from "@/server/queries";
import { requireAdmin } from "@/server/require-admin";
import { handleRouteError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — dashboard totals. Admin only. */
export async function GET() {
  try {
    await requireAdmin();
    return ok(await getDashboardStats());
  } catch (error) {
    return handleRouteError(error);
  }
}
