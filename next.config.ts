import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-lib"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [40, 45, 50, 55, 60, 75],
  },
};

export default nextConfig;
