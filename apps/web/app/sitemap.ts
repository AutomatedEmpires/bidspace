import type { MetadataRoute } from "next";
import { listPublicOpportunities } from "@bidspace/services";
import { tryGetDb } from "@/lib/safe-db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bidspace.app";

// Regenerate hourly at runtime — the build environment has no database, so a
// purely static sitemap would freeze without live opportunity URLs.
export const revalidate = 3600;

const STATIC_ROUTES = [
  "",
  "/explore",
  "/map",
  "/how-it-works",
  "/for-hosts",
  "/for-vendors",
  "/pricing",
  "/trust",
  "/about",
  "/terms",
  "/privacy",
  "/marketplace-rules",
  "/acceptable-use",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" || route === "/explore" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/explore" ? 0.9 : 0.6,
  }));

  const db = tryGetDb();
  if (db) {
    try {
      const opportunities = await listPublicOpportunities(db, { limit: 200 });
      for (const opportunity of opportunities) {
        entries.push({
          url: `${SITE_URL}/opportunities/${opportunity.slug ?? opportunity.id}`,
          lastModified: new Date(opportunity.updated_at),
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    } catch {
      // Sitemap stays static when the database is unreachable.
    }
  }

  return entries;
}
