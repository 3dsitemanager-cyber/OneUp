"use client";

import { FileText, ImageIcon, Loader2, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import {
  UPLOAD_KINDS,
  acceptAttribute,
  formatBytes,
  validateFile,
  type StoredFile,
  type UploadKind,
} from "@/lib/upload-policy";

type Props = {
  kind: UploadKind;
  value?: StoredFile | null;
  onChange: (file: StoredFile | null) => void;
  label?: string;
  /** Admin-only screens can offer removal; the public form should not. */
  allowDelete?: boolean;
};

/**
 * Uploads straight from the browser to Cloudinary using a one-shot signature
 * from /api/upload/sign. The file never passes through our server, so a 700 MB
 * asset archive is not limited by the platform's request body cap.
 */
export function FileUpload({ kind, value, onChange, label, allowDelete = false }: Props) {
  const policy = UPLOAD_KINDS[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    const problem = validateFile(kind, file);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, filename: file.name, bytes: file.size }),
      });
      const signJson = await signRes.json();
      if (!signRes.ok || !signJson.ok) {
        setError(signJson.error ?? "Could not authorise that upload.");
        return;
      }

      const s = signJson.data;
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", s.apiKey);
      form.append("timestamp", String(s.timestamp));
      form.append("signature", s.signature);
      form.append("folder", s.folder);
      form.append("public_id", s.publicId);

      // XHR rather than fetch: it reports upload progress, fetch does not.
      const stored = await new Promise<StoredFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", s.uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            let message = "Cloudinary rejected the upload.";
            try {
              message = JSON.parse(xhr.responseText).error?.message ?? message;
            } catch {
              /* keep the default */
            }
            reject(new Error(message));
            return;
          }
          const r = JSON.parse(xhr.responseText);
          resolve({
            url: r.secure_url,
            publicId: r.public_id,
            resourceType: r.resource_type ?? "raw",
            format: r.format ?? file.name.split(".").pop() ?? "",
            bytes: r.bytes ?? file.size,
            originalFilename: file.name,
          });
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(form);
      });

      onChange(stored);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!value) return;
    setBusy(true);
    try {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publicId: value.publicId, resourceType: value.resourceType }),
      });
      onChange(null);
    } catch {
      setError("Could not remove that file.");
    } finally {
      setBusy(false);
    }
  }

  const Icon = policy.resourceType === "image" ? ImageIcon : FileText;

  if (value) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm font-semibold hover:text-primary"
            >
              {value.originalFilename}
            </a>
            <p className="text-xs text-muted-foreground">
              {value.format.toUpperCase()} · {formatBytes(value.bytes)}
            </p>
          </div>
          {allowDelete && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              aria-label="Remove file"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 disabled:cursor-wait"
      >
        {busy ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        ) : policy.adminOnly ? (
          <UploadCloud className="size-4 shrink-0" />
        ) : (
          <Paperclip className="size-4 shrink-0" />
        )}
        <span className="min-w-0 flex-1">
          {busy ? (
            <>Uploading… {progress !== null && `${progress}%`}</>
          ) : (
            <>
              {label ?? policy.label}
              <span className="ml-1 opacity-70">
                — {policy.formats.join(", ")} up to {formatBytes(policy.maxBytes)}
              </span>
            </>
          )}
        </span>
      </button>

      {progress !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${progress}%`, background: "var(--gradient-primary)" }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute(kind)}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
