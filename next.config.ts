import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // mongoose pulls in optional native drivers it never uses in a serverless build;
  // keeping it external stops the bundler from trying to resolve them.
  serverExternalPackages: ["mongoose", "bcryptjs"],
  images: {
    remotePatterns: [
      // Product imagery uploaded through the admin Media Library.
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  /**
   * Baseline security headers.
   *
   * No Content-Security-Policy here: Next injects inline scripts for hydration,
   * so a CSP needs per-request nonces to avoid breaking the app. Worth adding
   * later, deliberately — a broken one is worse than none.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stop the browser guessing a content type — an uploaded file that
          // sniffs as HTML could otherwise run as a page.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No framing: blocks clickjacking of the admin panel and checkout.
          { key: "X-Frame-Options", value: "DENY" },
          // Don't leak the full URL (order ids, session ids) to other origins.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing here needs these devices.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HTTPS only, once live. Harmless on localhost (browsers ignore it there).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
