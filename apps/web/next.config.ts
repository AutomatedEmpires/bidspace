import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Sentry wrapping is itself env-gated: without SENTRY_ORG/SENTRY_PROJECT (source
// map upload needs an auth token at build time), this is a harmless no-op — the
// runtime SDK is separately gated on SENTRY_DSN in the instrumentation files.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "automated-empires",
      project: process.env.SENTRY_PROJECT ?? "bidspace",
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;
