import type { MetadataRoute } from "next";

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configuredUrl) return new URL(configuredUrl);
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("http://localhost:3000");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/agent/", "/customer/", "/api/", "/start/"],
    },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
