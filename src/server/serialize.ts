import type {
  Category,
  Complaint,
  ComplaintStatus,
  ComplaintType,
  ContactMessage,
  ContactStatus,
  CustomerSummary,
  Order,
  Product,
  StoredFileRef,
} from "@/lib/types";

/**
 * Mongoose lean() documents still carry ObjectId / Date instances, which cannot
 * cross the server→client boundary. Everything below flattens them to JSON.
 */

type Lean = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const id = (v: unknown) => String(v ?? "");
const date = (v: unknown) => (v instanceof Date ? v.toISOString() : str(v));

/** Cloudinary file sub-documents come back as plain objects on lean(). */
function storedFile(v: unknown): StoredFileRef | null {
  if (!v || typeof v !== "object") return null;
  const f = v as Lean;
  const url = str(f["url"]);
  if (!url) return null;
  return {
    url,
    publicId: str(f["publicId"]),
    resourceType: str(f["resourceType"], "raw"),
    format: str(f["format"]),
    bytes: num(f["bytes"]),
    originalFilename: str(f["originalFilename"]),
  };
}

export function serializeProduct(doc: Lean): Product {
  return {
    id: id(doc["_id"]),
    slug: str(doc["slug"]),
    name: str(doc["name"]),
    category: str(doc["category"], "Uncategorised"),
    price: num(doc["price"]),
    rating: num(doc["rating"]),
    sales: num(doc["sales"]),
    // Stored as isNewRelease (isNew is reserved by mongoose), exposed as isNew.
    isNew: doc["isNewRelease"] === true,
    image: str(doc["image"]),
    gallery: arr(doc["gallery"]),
    short: str(doc["short"]),
    description: str(doc["description"]),
    formats: arr(doc["formats"]),
    polygons: str(doc["polygons"]),
    textures: str(doc["textures"]),
    fileSize: str(doc["fileSize"]),
    software: arr(doc["software"]),
    features: arr(doc["features"]),
    highlights: arr(doc["highlights"]),
    license: str(doc["license"], "Standard commercial"),
    licenseTerms: str(doc["licenseTerms"]),
    delivery: str(doc["delivery"], "Instant secure download"),
    uvs: str(doc["uvs"]),
    // Defaults to true so a legacy document without the field stays visible.
    published: doc["published"] !== false,
    assetFile: storedFile(doc["assetFile"]),
  };
}

export function serializeContactMessage(doc: Lean): ContactMessage {
  return {
    id: id(doc["_id"]),
    name: str(doc["name"]),
    email: str(doc["email"]),
    subject: str(doc["subject"]),
    message: str(doc["message"]),
    status: str(doc["status"], "New") as ContactStatus,
    createdAt: date(doc["createdAt"]),
  };
}

export function serializeComplaint(doc: Lean): Complaint {
  return {
    id: id(doc["_id"]),
    orderId: str(doc["orderId"]),
    email: str(doc["email"]),
    product: str(doc["product"]),
    type: str(doc["type"], "Other") as ComplaintType,
    description: str(doc["description"]),
    status: str(doc["status"], "Open") as ComplaintStatus,
    attachment: storedFile(doc["attachment"]),
    createdAt: date(doc["createdAt"]),
  };
}

export function serializeCategory(doc: Lean): Category {
  return {
    id: id(doc["_id"]),
    name: str(doc["name"]),
    slug: str(doc["slug"]),
    count: num(doc["count"]),
    image: str(doc["image"]),
  };
}

export function serializeOrder(doc: Lean): Order {
  const items = Array.isArray(doc["items"]) ? (doc["items"] as Lean[]) : [];
  return {
    id: id(doc["_id"]),
    orderId: str(doc["orderId"]),
    customerName: str(doc["customerName"]),
    email: str(doc["email"]),
    country: str(doc["country"]),
    items: items.map((i) => ({
      slug: str(i["slug"]),
      name: str(i["name"]),
      category: str(i["category"]),
      image: str(i["image"]),
      price: num(i["price"]),
    })),
    subtotal: num(doc["subtotal"]),
    discount: num(doc["discount"]),
    total: num(doc["total"]),
    paymentMethod: str(doc["paymentMethod"], "card") as Order["paymentMethod"],
    status: str(doc["status"], "Paid") as Order["status"],
    createdAt: date(doc["createdAt"]),
  };
}

export function serializeCustomer(doc: Lean): CustomerSummary {
  return {
    id: id(doc["_id"]),
    name: str(doc["name"]),
    email: str(doc["email"]),
    plan: str(doc["plan"], "Indie"),
    orders: num(doc["orders"]),
    spend: num(doc["spend"]),
  };
}
