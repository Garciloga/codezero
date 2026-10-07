import 'server-only';
import { Metadata } from 'next';
import { localeContext, serverTranslator } from './server';
import { LANGUAGE_TAGS } from './shared';
export async function translatedMetadata(source: Metadata): Promise<Metadata> {
  const t = await serverTranslator();
  const { locale } = await localeContext();
  const title = typeof source.title === 'string' ? t(source.title) : source.title && 'default' in source.title ? { ...source.title, default: t(source.title.default) } : source.title;
  const description = source.description ? t(source.description) : source.description;
  const imageSuffix = '?lang=' + locale;
  const imageUrl = (url: string | URL) => typeof url === 'string' && url === '/social/codezero' ? url + imageSuffix : url;
  const images = source.openGraph?.images;
  const localizedImages = Array.isArray(images) ? images.map(image => {
    if (typeof image === 'object' && 'url' in image && typeof image.url === 'string' && image.url === '/social/codezero') {
      return { ...image, url: image.url + imageSuffix, alt: image.alt ? t(image.alt) : undefined };
    }
    return image;
  }) : images;
  const openGraph = source.openGraph ? { ...source.openGraph,
    title: typeof source.openGraph.title === 'string' ? t(source.openGraph.title) : source.openGraph.title,
    description: source.openGraph.description ? t(source.openGraph.description) : source.openGraph.description,
    images: localizedImages,
    locale: LANGUAGE_TAGS[locale].replace('-', '_'),
  } : source.openGraph;
  const twitter = source.twitter ? { ...source.twitter, title: typeof source.twitter.title === 'string' ? t(source.twitter.title) : source.twitter.title,
    description: source.twitter.description ? t(source.twitter.description) : source.twitter.description,
    ...('images' in source.twitter && Array.isArray(source.twitter.images) ? { images: source.twitter.images.map(image => typeof image === 'string' || image instanceof URL ? imageUrl(image) : { ...image, url: imageUrl(image.url), alt: image.alt ? t(image.alt) : undefined }) } : {}) } : source.twitter;
  return { ...source, title, description, openGraph, twitter };
}
