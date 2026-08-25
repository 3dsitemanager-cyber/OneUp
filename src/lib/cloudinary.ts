import "server-only";

import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary is configured here and nowhere else. This module is `server-only`,
 * so importing it from a client component is a build error — the API secret can
 * never end up in a browser bundle.
 *
 * The upload rules themselves live in `src/lib/upload-policy.ts`, which carries
 * no credentials and is shared with the browser.
 */

export class MissingCloudinaryConfigError extends Error {
  constructor() {
    super(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.",
    );
    this.name = "MissingCloudinaryConfigError";
  }
}

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

/** Read at call time, not module scope — see the same note in lib/mongodb.ts. */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName === "your-cloud-name") {
    throw new MissingCloudinaryConfigError();
  }

  return { cloudName, apiKey, apiSecret };
}

export function getCloudinary() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}
