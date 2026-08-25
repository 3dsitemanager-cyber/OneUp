import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/require-admin";
import { createSignedUpload } from "@/server/uploads";
import { UPLOAD_KINDS, UPLOAD_KIND_NAMES, validateFile } from "@/lib/upload-policy";
import { fail, handleRouteError, ok } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signSchema = z.object({
  kind: z.enum(UPLOAD_KIND_NAMES as [string, ...string[]]),
  filename: z.string().min(1).max(255),
  bytes: z.number().int().nonnegative(),
});

/**
 * POST /api/upload/sign — authorise one browser→Cloudinary direct upload.
 *
 * The response carries a signature, never the API secret. Folder and public_id
 * are baked into that signature, so the browser cannot redirect the upload
 * somewhere else or overwrite an existing file.
 */
export async function POST(request: NextRequest) {
  try {
    const body = signSchema.parse(await request.json());
    const kind = body.kind as keyof typeof UPLOAD_KINDS;

    if (UPLOAD_KINDS[kind].adminOnly) {
      await requireAdmin();
    }

    const problem = validateFile(kind, { name: body.filename, size: body.bytes });
    if (problem) return fail(problem, 422);

    return ok(createSignedUpload(kind, body.filename));
  } catch (error) {
    return handleRouteError(error);
  }
}
