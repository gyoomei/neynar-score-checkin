import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://neynar-score-checkin.vercel.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/api/score`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
  ];
}
