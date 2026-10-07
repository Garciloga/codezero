import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://codezero-nine.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/pricing", "/faq", "/terms", "/privacy", "/refunds", "/contact"],
      disallow: ["/internal/", "/admin", "/api/", "/checkout", "/dashboard", "/learn/", "/profile", "/tutor", "/certificate", "/login", "/reset-password", "/help/tickets", "/help/suggestions"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
