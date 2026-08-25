export const CATEGORY_NAMES = [
  "Characters",
  "Weapons",
  "Vehicles",
  "Environments",
  "Props",
  "Creatures",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

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

export type ComplaintType = (typeof COMPLAINT_TYPES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

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
  topAssets: { slug: string; name: string; value: number }[];
};
