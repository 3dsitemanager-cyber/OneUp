import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/**
 * Absolute base for canonical and OG URLs.
 *
 * `??` alone is not enough: an env var that exists but is empty (easy to do in
 * a hosting dashboard) is a string, not undefined, and `new URL("")` throws
 * during the build rather than at request time. Falls back to the URL the host
 * assigns — Vercel sets VERCEL_URL without a scheme — and finally to localhost.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OneUp Gaming — Premium 3D Game Assets Marketplace",
    template: "%s | OneUp Gaming",
  },
  description:
    "Game-ready 3D characters, environments, vehicles and props with 4K PBR textures and instant digital delivery.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    type: "website",
    siteName: "OneUp Gaming",
    title: "OneUp Gaming — Premium 3D Game Assets Marketplace",
    description: "Production-ready 3D assets for modern games. Instant digital delivery.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
