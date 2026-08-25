import type { Metadata } from "next";
import { CheckoutForm } from "@/components/site/CheckoutForm";

export const metadata: Metadata = {
  title: "Secure Checkout — OneUp Gaming 3D Marketplace",
  description: "Complete your purchase of premium 3D game assets securely.",
  robots: { index: false },
  openGraph: {
    title: "Secure Checkout — OneUp Gaming",
    description: "Encrypted payment and instant asset delivery.",
  },
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
