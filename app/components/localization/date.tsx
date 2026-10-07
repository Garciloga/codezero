'use client';
import { LANGUAGE_TAGS } from '../../../lib/localization/shared';
import { useLanguage } from './provider';
export default function LocalizedDate({ value, includeTime = false }: { value: string | number; includeTime?: boolean }) {
  const { locale } = useLanguage();
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return <time dateTime={date.toISOString()} translate="no">{includeTime ? date.toLocaleString(LANGUAGE_TAGS[locale], { timeZone: 'America/Mexico_City' }) : date.toLocaleDateString(LANGUAGE_TAGS[locale], { timeZone: 'America/Mexico_City' })}</time>;
}
