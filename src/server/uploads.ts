import "server-only";

import { getCloudinary, getCloudinaryConfig } from "@/lib/cloudinary";
import { UPLOAD_KINDS, type StoredFile, type UploadKind } from "@/lib/upload-policy";

type CloudinaryResult = {
  secure_url?: string;
  public_id?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  original_filename?: string;
};

function toStoredFile(result: CloudinaryResult, fallbackName: string): StoredFile {
  return {
    url: String(result.secure_url ?? ""),
    publicId: String(result.public_id ?? ""),
    resourceType: String(result.resource_type ?? "raw"),
    format: String(result.format ?? fallbackName.split(".").pop() ?? ""),
    bytes: Number(result.bytes ?? 0),
    originalFilename: fallbackName,
  };
}

/** Strip directory parts and anything Cloudinary would treat specially. */
function safeBaseName(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "file";
  return (
    base
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "file"
  );
}

/** Server-side upload. Best for small files that already reached our route. */
export async function uploadBuffer(
  kind: UploadKind,
  buffer: Buffer,
  filename: string,
): Promise<StoredFile> {
  const policy = UPLOAD_KINDS[kind];
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  // Re-validate server-side. The browser's check is a convenience, not a control.
  if (!(policy.formats as readonly string[]).includes(ext)) {
    throw new UploadRejectedError(`Only ${policy.formats.join(", ")} files are allowed here.`);
  }
  if (buffer.byteLength > policy.maxBytes) {
    throw new UploadRejectedError("That file is larger than this upload allows.");
  }
  if (buffer.byteLength === 0) {
    throw new UploadRejectedError("That file is empty.");
  }

  const cld = getCloudinary();

  const result = await new Promise<CloudinaryResult>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder: policy.folder,
        resource_type: policy.resourceType,
        public_id: `${safeBaseName(filename)}-${Date.now().toString(36)}`,
        // Never let Cloudinary infer an executable/deliverable type we did not intend.
        allowed_formats: [...policy.formats],
        overwrite: false,
      },
      (error, uploaded) => {
        if (error) reject(error);
        else resolve((uploaded ?? {}) as CloudinaryResult);
      },
    );
    stream.end(buffer);
  });

  return toStoredFile(result, filename);
}

/**
 * Parameters for a browser-side direct upload. The signature is computed with
 * the API secret here; the browser receives the signature but never the secret,
 * and it cannot change `folder` or `public_id` without invalidating it.
 */
export type SignedUpload = {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: string;
  maxBytes: number;
};

export function createSignedUpload(kind: UploadKind, filename: string): SignedUpload {
  const policy = UPLOAD_KINDS[kind];
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const cld = getCloudinary();

  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `${safeBaseName(filename)}-${Date.now().toString(36)}`;

  // Every signed field is pinned here — the browser cannot widen the policy.
  const paramsToSign: Record<string, string | number> = {
    folder: policy.folder,
    public_id: publicId,
    timestamp,
  };

  const signature = cld.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${policy.resourceType}/upload`,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: policy.folder,
    publicId,
    resourceType: policy.resourceType,
    maxBytes: policy.maxBytes,
  };
}

export async function deleteStoredFile(publicId: string, resourceType = "image"): Promise<boolean> {
  const cld = getCloudinary();
  const result = (await cld.uploader.destroy(publicId, { resource_type: resourceType })) as {
    result?: string;
  };
  return result.result === "ok" || result.result === "not found";
}

/** Everything stored under the oneupgaming/ namespace, newest first. */
export async function listStoredFiles(limit = 60): Promise<StoredFile[]> {
  const cld = getCloudinary();

  const response = (await cld.search
    .expression("folder:oneupgaming/*")
    .sort_by("created_at", "desc")
    .max_results(Math.min(limit, 100))
    .execute()) as { resources?: CloudinaryResult[] };

  return (response.resources ?? []).map((r) =>
    toStoredFile(r, `${String(r.public_id ?? "").split("/").pop()}.${r.format ?? ""}`),
  );
}

export class UploadRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadRejectedError";
  }
}
