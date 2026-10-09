import type { Metadata } from "next";

export function publicMetadata(title: string, description: string, path: string): Metadata {
  const image = { url: "/social/codezero", width: 1200, height: 630, alt: "Garciloga · Aprende para el trabajo real. Crece hacia lo que sigue." };
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: title + " · Garciloga", description, url: path, type: "website", locale: "es_MX", images: [image] },
    twitter: { card: "summary_large_image", title: title + " · Garciloga", description, images: [image] },
  };
}


