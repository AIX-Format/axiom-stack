import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  typedRoutes: true,
  turbopack: {
    root: path.resolve("../../"),
  },
};

export default nextConfig;
