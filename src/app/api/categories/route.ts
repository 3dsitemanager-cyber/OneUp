import { getCategories } from "@/server/queries";
import { handleRouteError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET /api/categories — the six curated collections shown on /categories. */
export async function GET() {
  try {
    return ok(await getCategories());
  } catch (error) {
    return handleRouteError(error);
  }
}
