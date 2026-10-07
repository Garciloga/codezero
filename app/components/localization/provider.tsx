'use client';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { Locale, Messages, translator } from '../../../lib/localization/shared';
const context = createContext<{ locale: Locale; t: (value: string) => string }>({ locale: 'es', t: value => value });
export function useLanguage() { return useContext(context); }
export default function LanguageProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: translator(messages) }), [locale, messages]);
  return <context.Provider value={value}>{children}</context.Provider>;
}
