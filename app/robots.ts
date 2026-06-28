import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/_next/",
        "/auth/callback",
        "/auth/confirm",
      ],
    },
    sitemap: "https://trubill.in/sitemap.xml",
  };
}
