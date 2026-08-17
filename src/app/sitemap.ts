import type { MetadataRoute } from "next";
import { getQuestions } from "@/lib/data";
import { getUsers } from "@/lib/auth";

const BASE = (process.env.SITE_URL || "http://localhost:3100").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [qs, users] = await Promise.all([getQuestions(), getUsers()]);
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/users`, changeFrequency: "daily", priority: 0.6 },
  ];
  for (const u of Object.values(users)) {
    entries.push({ url: `${BASE}/u/${u.accountNumber}`, changeFrequency: "weekly", priority: 0.5 });
  }
  for (const q of qs) {
    entries.push({ url: `${BASE}/q/${q.id}`, changeFrequency: "weekly", priority: 0.7 });
  }
  return entries;
}
