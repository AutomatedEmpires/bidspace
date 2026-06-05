import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bidspace/core", "@bidspace/db", "@bidspace/services"],
};

export default nextConfig;
