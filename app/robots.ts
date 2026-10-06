import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://codezero-nine.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/pricing", "/terms", "/privacy", "/refunds"],
      disallow: ["/admin", "/api/", "/checkout", "/dashboard", "/learn/", "/profile", "/tutor", "/certificate"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
