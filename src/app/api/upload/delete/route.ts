import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/require-admin";
import { deleteStoredFile } from "@/server/uploads";
import { fail, handleRouteError, ok } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteSchema = z.object({
  publicId: z.string().min(1).max(300),
  resourceType: z.enum(["image", "video", "raw"]).default("image"),
});

/**
 * POST /api/upload/delete — remove a file from Cloudinary. Admin only:
 * deletion is destructive and is never exposed to storefront visitors.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { publicId, resourceType } = deleteSchema.parse(await request.json());

    // Only ever touch our own namespace, whatever the caller sends.
    if (!publicId.startsWith("oneupgaming/")) {
      return fail("That file is outside the OneUp Gaming media folder.", 403);
    }

    const removed = await deleteStoredFile(publicId, resourceType);
    if (!removed) return fail("Cloudinary refused the delete.", 502);

    return ok({ publicId, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
