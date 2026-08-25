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
};

export default nextConfig;
