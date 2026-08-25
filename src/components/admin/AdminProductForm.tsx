"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/site/FileUpload";
import { CATEGORY_NAMES } from "@/lib/types";
import type { StoredFile } from "@/lib/upload-policy";

const FORMATS = ["FBX", "BLEND", "OBJ", "GLTF"];
const SOFTWARE = ["Blender", "Unity", "Unreal Engine", "Maya"];

/** Turns "Cyber Soldier Mk II" into "cyber-soldier-mk-ii" for the URL. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminProductForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORY_NAMES[0]);
  const [price, setPrice] = useState("");
  const [short, setShort] = useState("");
  const [description, setDescription] = useState("");
  const [polygons, setPolygons] = useState("");
  const [textures, setTextures] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [formats, setFormats] = useState<string[]>([]);
  const [software, setSoftware] = useState<string[]>([]);
  const [isNewRelease, setIsNewRelease] = useState(true);
  const [published, setPublished] = useState(true);
  const [image, setImage] = useState<StoredFile | null>(null);
  const [assetFile, setAssetFile] = useState<StoredFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The slug follows the name until an admin edits it by hand.
  const effectiveSlug = slugTouched ? slug : slugify(name);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (!image) {
      toast.error("A product image is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: effectiveSlug,
          name: name.trim(),
          category,
          price: Number(price || 0),
          short: short.trim(),
          description: description.trim(),
          polygons: polygons.trim(),
          textures: textures.trim(),
          fileSize: fileSize.trim(),
          formats,
          software,
          isNewRelease,
          published,
          image: image.url,
          gallery: [image.url],
          assetFile,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Could not create that product.");
        return;
      }

      toast.success(`${name} published`);
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "mt-2 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand";
  const labelText = "text-[11px] font-bold tracking-[0.14em] text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" /> BACK TO ASSETS
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold">ADD PRODUCT</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Publish a new 3D asset to the marketplace.
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {submitting ? "PUBLISHING…" : "PUBLISH PRODUCT"}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold">BASICS</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelText}>PRODUCT NAME *</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cyber Soldier"
                  className={field}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={labelText}>URL SLUG *</span>
                <input
                  required
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="cyber-soldier"
                  className={field}
                />
                <span className="mt-1.5 block text-xs text-muted-foreground">
                  /models/{effectiveSlug || "your-product"}
                </span>
              </label>

              <label className="block">
                <span className={labelText}>CATEGORY *</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={field}
                >
                  {CATEGORY_NAMES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelText}>PRICE (USD) *</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.00"
                  className={field}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={labelText}>SHORT DESCRIPTION *</span>
                <input
                  required
                  minLength={5}
                  maxLength={400}
                  value={short}
                  onChange={(e) => setShort(e.target.value)}
                  placeholder="Game-ready sci-fi soldier with 4K PBR textures."
                  className={field}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={labelText}>FULL DESCRIPTION</span>
                <textarea
                  rows={5}
                  maxLength={5000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Everything a buyer needs to know about this asset…"
                  className={`${field} resize-y`}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold">TECHNICAL SPECS</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={labelText}>POLYGONS</span>
                <input
                  value={polygons}
                  onChange={(e) => setPolygons(e.target.value)}
                  placeholder="42,500 tris"
                  className={field}
                />
              </label>
              <label className="block">
                <span className={labelText}>TEXTURES</span>
                <input
                  value={textures}
                  onChange={(e) => setTextures(e.target.value)}
                  placeholder="4K PBR"
                  className={field}
                />
              </label>
              <label className="block">
                <span className={labelText}>FILE SIZE</span>
                <input
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="240 MB"
                  className={field}
                />
              </label>
            </div>

            <div className="mt-5">
              <span className={labelText}>FORMATS</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggle(formats, setFormats, f)}
                    className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
                      formats.includes(f)
                        ? "border-brand bg-brand text-white"
                        : "border-border text-foreground hover:border-brand"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <span className={labelText}>COMPATIBLE SOFTWARE</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SOFTWARE.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(software, setSoftware, s)}
                    className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
                      software.includes(s)
                        ? "border-brand bg-brand text-white"
                        : "border-border text-foreground hover:border-brand"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold">MEDIA</h2>
            </div>
            <div className="mt-5 space-y-5">
              <FileUpload
                kind="product-image"
                value={image}
                onChange={setImage}
                label="Product image *"
                allowDelete
              />
              <FileUpload
                kind="product-asset"
                value={assetFile}
                onChange={setAssetFile}
                label="Downloadable asset archive"
                allowDelete
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold">VISIBILITY</h2>
            </div>
            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-border px-4 py-3">
                <span className="text-sm font-semibold">Publish immediately</span>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="size-4 accent-[var(--brand-blue)]"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-border px-4 py-3">
                <span className="text-sm font-semibold">Mark as new release</span>
                <input
                  type="checkbox"
                  checked={isNewRelease}
                  onChange={(e) => setIsNewRelease(e.target.checked)}
                  className="size-4 accent-[var(--brand-blue)]"
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
