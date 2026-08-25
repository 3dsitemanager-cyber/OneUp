import type { Metadata } from "next";
import { CartView } from "@/components/site/CartView";

export const metadata: Metadata = {
  title: "Your Cart — OneUp Gaming 3D Marketplace",
  description: "Review your selected 3D game assets before checkout.",
  openGraph: {
    title: "Your Cart — OneUp Gaming",
    description: "Secure digital purchase with instant delivery.",
  },
};

export default function CartPage() {
  return <CartView />;
}
