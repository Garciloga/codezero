import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerSupabase, getServerUser } from '../supabase-server';
import { Locale, LOCALE_COOKIE, validLocale, translator } from './shared';
export const localeContext = cache(async () => {
  const supabase = await createServerSupabase();
  const { data: { user } } = await getServerUser();
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const stored = user?.user_metadata?.locale;
  const locale: Locale = validLocale(stored) ? stored : validLocale(cookie) ? cookie : 'es';
  return { locale, user, supabase };
});
export const uiMessages = cache(async (locale: Locale) => {
  if (locale === 'es') return (await import('./es-ui.json')).default;
  switch (locale) {
    case 'en': return {...(await import('./en-ui.json')).default,...(await import('./en-client-extension.json')).default,...(await import('./en-social.json')).default};
    case 'pt': return {...(await import('./pt-ui.json')).default,...(await import('./pt-client-extension.json')).default,...(await import('./pt-social.json')).default};
    case 'fr': return {...(await import('./fr-ui.json')).default,...(await import('./fr-client-extension.json')).default,...(await import('./fr-social.json')).default};
  }
});
export const serverMessages = cache(async (locale: Locale) => {
  if (locale === 'es') return await uiMessages(locale);
  return locale === 'en' ? {...(await import('./en-server.json')).default,...(await import('./en-social.json')).default}
    : locale === 'pt' ? {...(await import('./pt-server.json')).default,...(await import('./pt-social.json')).default} : {...(await import('./fr-server.json')).default,...(await import('./fr-social.json')).default};
});
// Only immutable authored dictionaries are shared between requests, at most four entries.
const compiled = new Map<Locale, Promise<ReturnType<typeof translator>>>();
export function translationForLocale(locale: Locale) {
  let result = compiled.get(locale);
  if (!result) {
    result = (async () => {
      const curriculum = locale === 'es' ? (await import('./es-curriculum.json')).default
        : locale === 'en' ? (await import('./en-curriculum.json')).default
        : locale === 'pt' ? (await import('./pt-curriculum.json')).default : (await import('./fr-curriculum.json')).default;
      const extension=locale==='es'?{}:locale==='en'?(await import('./en-extension.json')).default:locale==='pt'?(await import('./pt-extension.json')).default:(await import('./fr-extension.json')).default;
      return translator({ ...await serverMessages(locale), ...curriculum,...extension });
    })();
    compiled.set(locale, result);
    result.catch(() => compiled.delete(locale));
  }
  return result;
}
export const serverTranslator = cache(async () => translationForLocale((await localeContext()).locale));

