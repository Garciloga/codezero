import type { Metadata } from "next";

export function publicMetadata(title: string, description: string, path: string): Metadata {
  const image = { url: "/social/codezero", width: 1200, height: 630, alt: "CodeZero · Aprende a programar desde cero, paso a paso." };
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: title + " · CodeZero", description, url: path, type: "website", locale: "es_MX", images: [image] },
    twitter: { card: "summary_large_image", title: title + " · CodeZero", description, images: [image] },
  };
}
