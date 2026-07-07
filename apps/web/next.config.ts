import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bidspace/core", "@bidspace/db", "@bidspace/services", "@bidspace/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
