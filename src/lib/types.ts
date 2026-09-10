/**
 * The categories the seed script creates. This is a *starting point*, not a
 * constraint: categories live in MongoDB and the admin can add, rename or
 * delete them, so nothing validates against this list. Kept only so the seed
 * and the empty-state copy have something to reference.
 */
export const SEED_CATEGORY_NAMES = [
  "Characters",
  "Weapons",
  "Vehicles",
  "Environments",
  "Props",
  "Creatures",
] as const;

/** A category name is free text — whatever the admin created. */
export type CategoryName = string;

// Kept here rather than in the mongoose models so client components can import
// them without pulling mongoose into the browser bundle.
export const COMPLAINT_TYPES = [
  "Download Problem",
  "Corrupted File",
  "Product Issue",
  "Payment Issue",
  "License Question",
  "Other",
] as const;

export const ORDER_STATUSES = ["Pending", "Paid", "Delivered", "Refunded"] as const;

export const CONTACT_STATUSES = ["New", "Read", "Replied"] as const;
export const COMPLAINT_STATUSES = ["Open", "In Review", "Resolved"] as const;

export type ComplaintType = (typeof COMPLAINT_TYPES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

/** Plain, serialisable product shape passed from server components to the client. */
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategoryName;
  price: number;
  rating: number;
  sales: number;
  isNew: boolean;
  image: string;
  gallery: string[];
  short: string;
  description: string;
  formats: string[];
  polygons: string;
  textures: string;
  fileSize: string;
  software: string[];
  features: string[];
  /**
   * The four badges shown under the price on the detail page. Free text so the
   * admin controls them per product — previously hardcoded in the component.
   */
  highlights: string[];
  /** Detail-page spec rows that used to be hardcoded strings. */
  license: string;
  licenseTerms: string;
  delivery: string;
  uvs: string;
  /** Admin-only fields — the storefront never reads these. */
  published: boolean;
  assetFile: StoredFileRef | null;
};

/** A file stored in Cloudinary, as it round-trips through the API. */
export type StoredFileRef = {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  originalFilename: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
};

export type Complaint = {
  id: string;
  orderId: string;
  email: string;
  product: string;
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  attachment: StoredFileRef | null;
  createdAt: string;
};

export type Category = {
  id: string;
  name: CategoryName;
  slug: string;
  count: number;
  image: string;
};

export type OrderItem = {
  slug: string;
  name: string;
  category: string;
  image: string;
  price: number;
};

export type Order = {
  id: string;
  orderId: string;
  customerName: string;
  email: string;
  country: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "card" | "wallet" | "bank";
  status: "Pending" | "Paid" | "Delivered" | "Refunded";
  createdAt: string;
};

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  plan: string;
  orders: number;
  spend: number;
};

export type DashboardStats = {
  revenue: number;
  downloads: number;
  liveAssets: number;
  orderCount: number;
  /** Items waiting on the admin — unread messages and unresolved tickets. */
  unreadMessages: number;
  openComplaints: number;
  topAssets: { slug: string; name: string; value: number }[];

  /** Rolling 30-day revenue, one point per day, oldest first. */
  revenueSeries: { date: string; revenue: number; orders: number }[];
  /** Revenue split by catalogue category, largest first. */
  categorySplit: { category: string; revenue: number; units: number }[];
  /** Order counts per status — drives the fulfilment breakdown. */
  statusSplit: { status: OrderStatus; count: number; total: number }[];
  /** Share of orders per payment method. */
  paymentSplit: { method: string; count: number }[];
  /** Headline comparisons against the previous 30-day window. */
  trends: {
    revenue: TrendDelta;
    orders: TrendDelta;
    customers: TrendDelta;
    avgOrderValue: TrendDelta;
  };
};

/** A measure compared against the preceding window of equal length. */
export type TrendDelta = {
  current: number;
  previous: number;
  /** Percent change, or null when there is no baseline to compare against. */
  changePct: number | null;
};
