"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FileUpload } from "@/components/site/FileUpload";
import { GalleryUpload } from "@/components/admin/GalleryUpload";
import { TagInput } from "@/components/admin/TagInput";
import { CategorySelect } from "@/components/admin/CategorySelect";
import type { Product } from "@/lib/types";
import type { StoredFile } from "@/lib/upload-policy";

// Suggestions only — every one of these fields accepts free text.
const FORMATS = ["FBX", "BLEND", "OBJ", "GLTF"] as const;
const SOFTWARE = ["Blender", "Unity", "Unreal Engine", "Maya"] as const;
const HIGHLIGHTS = ["4K TEXTURES", "PBR MATERIALS", "GAME READY", "RIGGED"] as const;

/**
 * A saved product stores only the image URL, but FileUpload works in StoredFile
 * shape. The publicId is recovered from the Cloudinary URL so Replace/Delete
 * still target the right object.
 */
function asStoredFile(url: string): StoredFile {
  const match = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i.exec(url);
  return {
    url,
    publicId: match?.[1] ?? "",
    resourceType: "image",
    format: url.split(".").pop() ?? "",
    bytes: 0,
    originalFilename: url.split("/").pop() ?? "image",
  };
}

/** Turns "Cyber Soldier Mk II" into "cyber-soldier-mk-ii" for the URL. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Create and edit share one form. Passing `product` switches it to edit mode:
 * the slug becomes read-only (it is the document key and the public URL) and
 * the submit goes to PATCH instead of POST.
 */
export function AdminProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [category, setCategory] = useState<string>(product?.category ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [short, setShort] = useState(product?.short ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [polygons, setPolygons] = useState(product?.polygons ?? "");
  const [textures, setTextures] = useState(product?.textures ?? "");
  const [fileSize, setFileSize] = useState(product?.fileSize ?? "");
  const [formats, setFormats] = useState<string[]>(product?.formats ?? []);
  const [software, setSoftware] = useState<string[]>(product?.software ?? []);
  const [features, setFeatures] = useState<string[]>(product?.features ?? []);
  const [highlights, setHighlights] = useState<string[]>(product?.highlights ?? []);
  const [license, setLicense] = useState(product?.license ?? "Standard commercial");
  const [licenseTerms, setLicenseTerms] = useState(product?.licenseTerms ?? "");
  const [delivery, setDelivery] = useState(product?.delivery ?? "Instant secure download");
  const [uvs, setUvs] = useState(product?.uvs ?? "");
  const [isNewRelease, setIsNewRelease] = useState(product?.isNew ?? true);
  const [published, setPublished] = useState(product?.published ?? true);
  // Saved products store plain URLs; wrap them so GalleryUpload can manage them.
  const [gallery, setGallery] = useState<StoredFile[]>(() => {
    const urls = product?.gallery?.length ? product.gallery : product?.image ? [product.image] : [];
    return urls.map(asStoredFile);
  });
  const [assetFile, setAssetFile] = useState<StoredFile | null>(product?.assetFile ?? null);
  const [submitting, setSubmitting] = useState(false);

  // The slug follows the name until an admin edits it by hand.
  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (gallery.length === 0) {
      toast.error("Add at least one product image.");
      return;
    }
    if (!category) {
      toast.error("Pick a category, or create one.");
      return;
    }

    setSubmitting(true);
    try {
      // PATCH takes the slug in the path and rejects it in the body, so the
      // create-only fields are added conditionally.
      const payload = {
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
        features,
        highlights,
        license: license.trim(),
        licenseTerms: licenseTerms.trim(),
        delivery: delivery.trim(),
        uvs: uvs.trim(),
        isNewRelease,
        published,
        // The first gallery entry is the cover used on cards and listings.
        image: gallery[0]!.url,
        gallery: gallery.map((g) => g.url),
        assetFile,
      };

      const res = await fetch(
        isEdit ? `/api/products/${product!.slug}` : "/api/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(isEdit ? payload : { ...payload, slug: effectiveSlug }),
        },
      );
      const json = await res.json();

      if (!res.ok || !json.ok) {
        toast.error(json.error ?? `Could not ${isEdit ? "save" : "create"} that product.`);
        return;
      }

      toast.success(isEdit ? `${name} saved` : `${name} published`);
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
  const labelText = "font-display text-[11px] font-bold tracking-[0.14em] text-foreground";

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
          <h1 className="mt-2 font-display text-3xl font-bold">
            {isEdit ? "EDIT PRODUCT" : "ADD PRODUCT"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isEdit
              ? `Editing ${product!.slug} — changes go live as soon as you save.`
              : "Publish a new 3D asset to the marketplace."}
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {submitting
            ? isEdit
              ? "SAVING…"
              : "PUBLISHING…"
            : isEdit
              ? "SAVE CHANGES"
              : "PUBLISH PRODUCT"}
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
                  // The slug is the document key and the public URL — changing it
                  // would orphan existing links, so edits go through delete + recreate.
                  readOnly={isEdit}
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="cyber-soldier"
                  className={`${field} ${isEdit ? "cursor-not-allowed opacity-60" : ""}`}
                />
                <span className="mt-1.5 block text-xs text-muted-foreground">
                  {isEdit
                    ? "The URL slug can't change after publishing."
                    : `/models/${effectiveSlug || "your-product"}`}
                </span>
              </label>

              <div className="block">
                <span className={labelText}>CATEGORY *</span>
                <CategorySelect value={category} onChange={setCategory} className={`${field} mt-0`} />
              </div>

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
              <TagInput
                value={formats}
                onChange={setFormats}
                suggestions={FORMATS}
                placeholder="Type a format and press Enter"
              />
            </div>

            <div className="mt-5">
              <span className={labelText}>COMPATIBLE SOFTWARE</span>
              <TagInput
                value={software}
                onChange={setSoftware}
                suggestions={SOFTWARE}
                placeholder="Type software and press Enter"
              />
            </div>

            <div className="mt-5">
              <span className={labelText}>UV MAPPING</span>
              <input
                value={uvs}
                onChange={(e) => setUvs(e.target.value)}
                placeholder="Non-overlapping, packed"
                className={field}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold">DETAIL PAGE CONTENT</h2>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Everything a buyer sees on the product page.
            </p>

            <div className="mt-5">
              <span className={labelText}>HIGHLIGHT BADGES</span>
              <TagInput
                value={highlights}
                onChange={setHighlights}
                suggestions={HIGHLIGHTS}
                max={8}
                placeholder="e.g. GAME READY"
              />
              <span className="mt-1.5 block text-xs text-muted-foreground">
                Shown as ticked badges under the price. The first four fit best.
              </span>
            </div>

            <div className="mt-5">
              <span className={labelText}>FEATURE LIST</span>
              <TagInput
                value={features}
                onChange={setFeatures}
                placeholder="Add a feature and press Enter"
              />
              <span className="mt-1.5 block text-xs text-muted-foreground">
                Fills the FEATURES tab on the product page.
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelText}>LICENSE NAME</span>
                <input
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="Standard commercial"
                  className={field}
                />
              </label>
              <label className="block">
                <span className={labelText}>DELIVERY</span>
                <input
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  placeholder="Instant secure download"
                  className={field}
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className={labelText}>LICENSE TERMS</span>
              <textarea
                rows={4}
                maxLength={3000}
                value={licenseTerms}
                onChange={(e) => setLicenseTerms(e.target.value)}
                placeholder="What the buyer may and may not do with this asset…"
                className={`${field} resize-y`}
              />
              <span className="mt-1.5 block text-xs text-muted-foreground">
                Shown in the LICENSE tab.
              </span>
            </label>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold">IMAGES</h2>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Up to 8 views — these fill the gallery on the product page.
            </p>

            {/* Matches the detail page: one large square view plus thumbnails. */}
            {gallery[0] && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={gallery[0].url}
                    alt="Cover preview"
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <p className="border-t border-border px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
                  COVER PREVIEW — AS SHOWN ON THE PRODUCT PAGE
                </p>
              </div>
            )}

            <div className="mt-5">
              <GalleryUpload value={gallery} onChange={setGallery} max={8} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold">DOWNLOADABLE FILE</h2>
            </div>
            <div className="mt-5">
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
