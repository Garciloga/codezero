export const LOCALES = ['es', 'en', 'pt', 'fr'] as const;
export type Locale = typeof LOCALES[number];
export type Messages = Record<string, string>;
export const LANGUAGE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' };
export const LANGUAGE_TAGS: Record<Locale, string> = { es: 'es-MX', en: 'en', pt: 'pt-BR', fr: 'fr' };
export const LOCALE_COOKIE = 'codezero_locale';
export function validLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
export function normalizeText(text: string) { return text.replace(/\s+/g, ' ').trim(); }
export function translator(messages: Messages) {
  const normalized = new Map(Object.entries(messages).map(([key, value]) => [normalizeText(key), value]));
  const templates = Object.entries(messages).filter(([key]) => /\{\d+\}/.test(key)).map(([key, value]) => {
    const order: number[] = [];
    const pattern = normalizeText(key).split(/(\{\d+\})/).map(part => {
      const match = part.match(/^\{(\d+)\}$/);
      if (match) { order.push(Number(match[1])); return '(.*?)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    return { pattern: new RegExp('^' + pattern + '$'), value, order };
  });
  return (source: string): string => {
    const key = normalizeText(source);
    let result = messages[source] ?? normalized.get(key);
    if (result === undefined) for (const entry of templates) {
      const match = key.match(entry.pattern);
      if (match) {
        result = entry.value.replace(/\{(\d+)\}/g, (token, index) => {
          const position = entry.order.indexOf(Number(index));
          return position >= 0 ? match[position + 1] : token;
        });
        break;
      }
    }
    // The founder's history names the original brand; preserve that historical fact.
    const brand = (copy: string) => key.startsWith("Empezó con el nombre CodeZero,") ? copy : copy.replaceAll("CodeZero", "Garciloga");
    if (result === undefined || !key) return brand(source);
    return brand(source.match(/^\s*/)?.[0] + result + (source.match(/\s*$/)?.[0] ?? ''));
  };
}

