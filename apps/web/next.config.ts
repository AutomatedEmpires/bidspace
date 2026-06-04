import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bidspace/core", "@bidspace/db"],
};

export default nextConfig;
