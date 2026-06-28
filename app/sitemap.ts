import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://trubill.in",                       lastModified: "2026-06-28", changeFrequency: "weekly",  priority: 1.0 },
    { url: "https://trubill.in/pricing",                lastModified: "2026-06-28", changeFrequency: "monthly", priority: 0.9 },
    { url: "https://trubill.in/about",                  lastModified: "2026-06-20", changeFrequency: "monthly", priority: 0.7 },
    { url: "https://trubill.in/contact",                lastModified: "2026-06-01", changeFrequency: "yearly",  priority: 0.5 },
    { url: "https://trubill.in/solutions/restaurants",  lastModified: "2026-06-28", changeFrequency: "monthly", priority: 0.9 },
    { url: "https://trubill.in/solutions/footwear",     lastModified: "2026-06-28", changeFrequency: "monthly", priority: 0.9 },
    { url: "https://trubill.in/solutions/textile",      lastModified: "2026-06-28", changeFrequency: "monthly", priority: 0.8 },
    { url: "https://trubill.in/solutions/juice-shops",  lastModified: "2026-06-28", changeFrequency: "monthly", priority: 0.8 },
    { url: "https://trubill.in/privacy",                lastModified: "2026-05-01", changeFrequency: "yearly",  priority: 0.3 },
    { url: "https://trubill.in/terms",                  lastModified: "2026-05-01", changeFrequency: "yearly",  priority: 0.3 },
  ];
}
