"use client";

import Image from "next/image";
import { Check, Copy, FileText, ImageIcon, Loader2, Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/site/FileUpload";
import { formatBytes, type StoredFile, type UploadKind } from "@/lib/upload-policy";

const uploaders: { kind: UploadKind; title: string; hint: string }[] = [
  {
    kind: "product-image",
    title: "PRODUCT IMAGE",
    hint: "Thumbnails and gallery shots for asset listings.",
  },
  {
    kind: "product-doc",
    title: "DOCUMENT / PDF",
    hint: "Licences, spec sheets and documentation.",
  },
  {
    kind: "product-asset",
    title: "3D ASSET ARCHIVE",
    hint: "The downloadable ZIP/FBX/BLEND delivered after purchase.",
  },
];

export function MediaLibrary({
  initialFiles,
  loadError,
}: {
  initialFiles: StoredFile[];
  loadError: string | null;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function addFile(file: StoredFile | null) {
    if (!file) return;
    setFiles((prev) => [file, ...prev.filter((f) => f.publicId !== file.publicId)]);
    toast.success(`${file.originalFilename} uploaded`);
  }

  async function copyUrl(file: StoredFile) {
    try {
      await navigator.clipboard.writeText(file.url);
      setCopied(file.publicId);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Clipboard is blocked in this browser.");
    }
  }

  async function remove(file: StoredFile) {
    if (!window.confirm(`Delete "${file.originalFilename}" from Cloudinary permanently?`)) return;

    setDeleting(file.publicId);
    try {
      const res = await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publicId: file.publicId, resourceType: file.resourceType }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not delete that file.");
        return;
      }
      setFiles((prev) => prev.filter((f) => f.publicId !== file.publicId));
      toast.success("File deleted");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl font-bold">MEDIA LIBRARY</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Images, PDFs and asset archives stored in Cloudinary. Uploads go straight from your
          browser to Cloudinary — large files never pass through this server.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {uploaders.map((u) => (
          <div key={u.kind} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
              {u.title}
            </h2>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">{u.hint}</p>
            <FileUpload kind={u.kind} value={null} onChange={addFile} />
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">
          STORED FILES{files.length > 0 && ` (${files.length})`}
        </h2>

        {loadError && (
          <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
            <p className="text-sm font-semibold text-destructive">Cloudinary unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </div>
        )}

        {!loadError && files.length === 0 && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-14 text-center">
            <p className="font-display text-xl font-bold">NOTHING UPLOADED YET</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Use one of the boxes above to add your first file.
            </p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((f) => (
              <div key={f.publicId} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative flex h-40 items-center justify-center bg-surface">
                  {f.resourceType === "image" ? (
                    <Image src={f.url} alt={f.originalFilename} fill className="object-cover" sizes="33vw" />
                  ) : (
                    <FileIcon format={f.format} />
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-semibold" title={f.originalFilename}>
                    {f.originalFilename}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(f.format || f.resourceType).toUpperCase()} · {formatBytes(f.bytes)}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70" title={f.publicId}>
                    {f.publicId}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => copyUrl(f)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-bold tracking-wide transition-colors hover:border-primary/50"
                    >
                      {copied === f.publicId ? (
                        <>
                          <Check className="size-3.5 text-lime" /> COPIED
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" /> COPY URL
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => remove(f)}
                      disabled={deleting === f.publicId}
                      aria-label={`Delete ${f.originalFilename}`}
                      className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                    >
                      {deleting === f.publicId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FileIcon({ format }: { format: string }) {
  const f = format.toLowerCase();
  const Icon = ["pdf", "txt", "md", "log"].includes(f)
    ? FileText
    : ["zip", "rar", "7z", "fbx", "blend", "obj", "glb", "gltf"].includes(f)
      ? Package
      : ImageIcon;

  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <Icon className="size-9" />
      <span className="text-[11px] font-bold tracking-[0.14em]">{format.toUpperCase()}</span>
    </div>
  );
}
