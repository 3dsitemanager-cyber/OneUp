"use client";

import Image from "next/image";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  UPLOAD_KINDS,
  acceptAttribute,
  formatBytes,
  validateFile,
  type StoredFile,
} from "@/lib/upload-policy";

type Props = {
  value: StoredFile[];
  onChange: (files: StoredFile[]) => void;
  max?: number;
};

const KIND = "product-image" as const;

/**
 * Multi-image uploader for a product gallery. Same signed direct-to-Cloudinary
 * path as FileUpload, but it holds an ordered list: the first image is the
 * cover shown on cards and as the detail page's opening view.
 */
export function GalleryUpload({ value, onChange, max = 8 }: Props) {
  const policy = UPLOAD_KINDS[KIND];
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const full = value.length >= max;

  async function uploadOne(file: File): Promise<StoredFile> {
    const signRes = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: KIND, filename: file.name, bytes: file.size }),
    });
    const signJson = await signRes.json();
    if (!signRes.ok || !signJson.ok) {
      throw new Error(signJson.error ?? "Could not authorise that upload.");
    }

    const s = signJson.data;
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", s.apiKey);
    form.append("timestamp", String(s.timestamp));
    form.append("signature", s.signature);
    form.append("folder", s.folder);
    form.append("public_id", s.publicId);

    const res = await fetch(s.uploadUrl, { method: "POST", body: form });
    if (!res.ok) {
      let message = "Cloudinary rejected the upload.";
      try {
        message = (await res.json()).error?.message ?? message;
      } catch {
        /* keep the default */
      }
      throw new Error(message);
    }
    const r = await res.json();
    return {
      url: r.secure_url,
      publicId: r.public_id,
      resourceType: r.resource_type ?? "image",
      format: r.format ?? file.name.split(".").pop() ?? "",
      bytes: r.bytes ?? file.size,
      originalFilename: file.name,
    };
  }

  async function handleFiles(list: FileList) {
    setError(null);
    const room = max - value.length;
    const files = Array.from(list).slice(0, room);
    if (files.length === 0) return;

    if (list.length > room) {
      setError(`Only ${room} more ${room === 1 ? "image" : "images"} can be added.`);
    }

    for (const f of files) {
      const problem = validateFile(KIND, f);
      if (problem) {
        setError(problem);
        return;
      }
    }

    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const uploaded: StoredFile[] = [];
    try {
      // Sequential: each upload needs its own signature, and this keeps the
      // progress count honest rather than showing everything at once.
      for (const f of files) {
        uploaded.push(await uploadOne(f));
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      // Keep whatever succeeded so a late failure doesn't discard earlier work.
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(index: number) {
    const target = value[index];
    if (!target) return;
    onChange(value.filter((_, i) => i !== index));

    // Best-effort cleanup; the listing is already correct either way.
    try {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publicId: target.publicId, resourceType: target.resourceType }),
      });
    } catch {
      /* the image is unlinked regardless */
    }
  }

  /** Promote an image to cover by moving it to the front. */
  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    if (picked) onChange([picked, ...next]);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((img, i) => (
          <figure
            // Index-suffixed: the same URL can legitimately appear twice, and a
            // bare url/publicId key would collide.
            key={`${img.publicId || img.url}-${i}`}
            className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
              i === 0 ? "border-brand" : "border-border"
            }`}
          >
            <Image
              src={img.url}
              alt={img.originalFilename || `Product image ${i + 1}`}
              fill
              sizes="200px"
              className="object-cover"
            />

            {i === 0 && (
              <figcaption className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                COVER
              </figcaption>
            )}

            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  aria-label={`Make image ${i + 1} the cover`}
                  title="Make cover"
                  className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-foreground transition-colors hover:bg-white"
                >
                  <Star className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove image ${i + 1}`}
                title="Remove"
                className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-destructive transition-colors hover:bg-white"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </figure>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface text-muted-foreground transition-colors hover:border-brand hover:text-brand disabled:cursor-wait"
          >
            {busy ? (
              <>
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs font-semibold">
                  {progress ? `${progress.done}/${progress.total}` : "Uploading…"}
                </span>
              </>
            ) : (
              <>
                <ImagePlus className="size-6" />
                <span className="text-xs font-bold">ADD IMAGES</span>
                <span className="px-2 text-center text-[10px] leading-tight opacity-70">
                  {value.length}/{max} · up to {formatBytes(policy.maxBytes)}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute(KIND)}
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        {value.length === 0
          ? "The first image you add becomes the cover shown on listings."
          : "Hover an image to remove it or make it the cover."}
      </p>

      {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}
