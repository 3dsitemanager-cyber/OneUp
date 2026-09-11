import type { Metadata } from "next";
import { DownloadsLookup } from "@/components/site/DownloadsLookup";

export const metadata: Metadata = {
  title: "Your Downloads — OneUp Gaming",
  description: "Retrieve the files from a OneUp Gaming order using your order ID and email.",
  // Buyer-only lookup page — nothing here belongs in search results.
  robots: { index: false, follow: true },
};

export default function DownloadsPage() {
  return <DownloadsLookup />;
}
