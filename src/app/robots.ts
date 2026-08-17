import type { MetadataRoute } from "next";

const BASE = (process.env.SITE_URL || "http://localhost:3100").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
