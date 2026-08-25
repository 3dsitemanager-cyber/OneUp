import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/require-admin";
import { listStoredFiles, uploadBuffer } from "@/server/uploads";
import { UPLOAD_KINDS, isUploadKind } from "@/lib/upload-policy";
import { fail, handleRouteError, ok } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/upload — media library listing. Admin only. */
export async function GET() {
  try {
    await requireAdmin();
    return ok(await listStoredFiles());
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/upload — multipart upload that passes through this server.
 *
 * Suits small files (images, PDFs, screenshots). Large 3D archives should use
 * POST /api/upload/sign and go to Cloudinary directly, since serverless hosts
 * cap request bodies well below this policy's 2 GB asset limit.
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const kind = form.get("kind");
    const file = form.get("file");

    if (!isUploadKind(kind)) {
      return fail("Unknown upload kind.", 422);
    }

    // Public kinds stay open; everything else needs an admin session.
    if (UPLOAD_KINDS[kind].adminOnly) {
      await requireAdmin();
    }

    if (!(file instanceof File)) {
      return fail("No file was provided.", 422);
    }
    if (file.size > UPLOAD_KINDS[kind].maxBytes) {
      return fail("That file is larger than this upload allows.", 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadBuffer(kind, buffer, file.name);

    return ok(stored, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
