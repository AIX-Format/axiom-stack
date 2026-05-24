import type { NextConfig } from "next";

/**
 * Next.js config for the L0 authority surface (axiomid.app).
 *
 * Production headers and caching policies live in `vercel.json`; this file
 * only carries the build-time toggles Next.js itself owns.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  typedRoutes: true,
};

export default nextConfig;
