/**
 * Upload rules shared by the browser and the server.
 *
 * Contains NO credentials — safe to import from a client component. The client
 * uses this only to pre-validate and render hints; `src/lib/cloudinary.ts`
 * enforces the very same limits server-side, which is the check that counts.
 */

/**
 * Folders are a fixed allow-list. A caller picks a *kind*, never a raw folder
 * path, so nothing can write outside these locations or escape with "../".
 */
export const UPLOAD_KINDS = {
  "product-image": {
    label: "Product image",
    folder: "oneupgaming/products",
    resourceType: "image",
    maxBytes: 10 * 1024 * 1024, // 10 MB
    formats: ["jpg", "jpeg", "png", "webp", "avif"],
    adminOnly: true,
  },
  "product-asset": {
    label: "3D asset archive",
    folder: "oneupgaming/assets",
    resourceType: "raw",
    maxBytes: 2 * 1024 * 1024 * 1024, // 2 GB — 3D archives are large
    formats: ["zip", "rar", "7z", "fbx", "blend", "obj", "glb", "gltf"],
    adminOnly: true,
  },
  "product-doc": {
    label: "Document / PDF",
    folder: "oneupgaming/docs",
    resourceType: "raw",
    maxBytes: 25 * 1024 * 1024, // 25 MB
    formats: ["pdf", "txt", "md"],
    adminOnly: true,
  },
  "complaint-attachment": {
    label: "Support attachment",
    folder: "oneupgaming/complaints",
    resourceType: "auto",
    maxBytes: 10 * 1024 * 1024, // 10 MB
    formats: ["jpg", "jpeg", "png", "webp", "pdf", "txt", "log", "zip"],
    adminOnly: false, // customers attach screenshots and logs
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

export const UPLOAD_KIND_NAMES = Object.keys(UPLOAD_KINDS) as UploadKind[];

export function isUploadKind(value: unknown): value is UploadKind {
  return typeof value === "string" && value in UPLOAD_KINDS;
}

/** A file stored in Cloudinary, as persisted on a product or complaint. */
export type StoredFile = {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  originalFilename: string;
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

/** The `accept` attribute for a file input of this kind. */
export function acceptAttribute(kind: UploadKind): string {
  return UPLOAD_KINDS[kind].formats.map((f) => `.${f}`).join(",");
}

/** Client-side pre-check. Returns an error message, or null when the file is fine. */
export function validateFile(kind: UploadKind, file: { name: string; size: number }): string | null {
  const policy = UPLOAD_KINDS[kind];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!(policy.formats as readonly string[]).includes(ext)) {
    return `Only ${policy.formats.join(", ")} files are allowed here.`;
  }
  if (file.size > policy.maxBytes) {
    return `That file is ${formatBytes(file.size)} — the limit is ${formatBytes(policy.maxBytes)}.`;
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  return null;
}
