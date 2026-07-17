import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    // Product images come from the connected WooCommerce store; allow any
    // remote host since the store URL is configured at runtime via env.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
