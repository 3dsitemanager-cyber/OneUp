import type { Metadata } from "next";
import { CartView } from "@/components/site/CartView";

export const metadata: Metadata = {
  title: "Your Cart — OneUp Gaming 3D Marketplace",
  description: "Review your selected 3D game assets before checkout.",
  // A per-visitor page with nothing to rank — keep it out of the index.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Your Cart — OneUp Gaming",
    description: "Secure digital purchase with instant delivery.",
  },
};

export default function CartPage() {
  return <CartView />;
}
