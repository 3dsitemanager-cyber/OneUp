export const formatPrice = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

export const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
