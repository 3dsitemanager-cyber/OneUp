import type { Category, CategoryName, CustomerSummary, Order, Product } from "@/lib/types";

/**
 * Mongoose lean() documents still carry ObjectId / Date instances, which cannot
 * cross the server→client boundary. Everything below flattens them to JSON.
 */

type Lean = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const id = (v: unknown) => String(v ?? "");

export function serializeProduct(doc: Lean): Product {
  return {
    id: id(doc["_id"]),
    slug: str(doc["slug"]),
    name: str(doc["name"]),
    category: str(doc["category"], "Props") as CategoryName,
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
  };
}

export function serializeCategory(doc: Lean): Category {
  return {
    id: id(doc["_id"]),
    name: str(doc["name"]) as CategoryName,
    slug: str(doc["slug"]),
    count: num(doc["count"]),
    image: str(doc["image"]),
  };
}

export function serializeOrder(doc: Lean): Order {
  const items = Array.isArray(doc["items"]) ? (doc["items"] as Lean[]) : [];
  const createdAt = doc["createdAt"];
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
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : str(createdAt),
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
