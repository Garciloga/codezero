import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerSupabase } from '../supabase-server';
import { Locale, LOCALE_COOKIE, validLocale, translator } from './shared';
export const localeContext = cache(async () => {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const stored = user?.user_metadata?.locale;
  const locale: Locale = validLocale(stored) ? stored : validLocale(cookie) ? cookie : 'es';
  return { locale, user, supabase };
});
export const uiMessages = cache(async (locale: Locale) => {
  if (locale === 'es') return (await import('./es-ui.json')).default;
  switch (locale) {
    case 'en': return (await import('./en-ui.json')).default;
    case 'pt': return (await import('./pt-ui.json')).default;
    case 'fr': return (await import('./fr-ui.json')).default;
  }
});
export const serverMessages = cache(async (locale: Locale) => {
  if (locale === 'es') return await uiMessages(locale);
  return locale === 'en' ? (await import('./en-server.json')).default
    : locale === 'pt' ? (await import('./pt-server.json')).default : (await import('./fr-server.json')).default;
});
export const serverTranslator = cache(async () => {
  const { locale } = await localeContext();
  const curriculum = locale === 'es' ? (await import('./es-curriculum.json')).default
    : locale === 'en' ? (await import('./en-curriculum.json')).default
    : locale === 'pt' ? (await import('./pt-curriculum.json')).default : (await import('./fr-curriculum.json')).default;
  return translator({ ...await serverMessages(locale), ...curriculum });
});
