import type { Metadata } from "next";
import { listStoredFiles } from "@/server/uploads";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import type { StoredFile } from "@/lib/upload-policy";

export const metadata: Metadata = {
  title: "Media Library — OneUp Gaming Admin",
  description: "Images, PDFs and 3D asset archives stored in Cloudinary.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  let files: StoredFile[] = [];
  let error: string | null = null;

  // A missing Cloudinary config should render an explanation, not a 500.
  try {
    files = await listStoredFiles();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not reach Cloudinary.";
  }

  return <MediaLibrary initialFiles={files} loadError={error} />;
}
