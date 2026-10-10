'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGE_NAMES, LOCALES } from '../../../lib/localization/shared';
import { useLanguage } from './provider';
const copy = {
  es: { label: 'Idioma', saving: 'Guardando idioma…', error: 'No pudimos guardar el idioma. Inténtalo de nuevo.', beta: 'Idioma principal' },
  en: { label: 'Language', saving: 'Saving language…', error: 'We could not save your language. Please try again.', beta: 'Translation beta' },
  pt: { label: 'Idioma', saving: 'Salvando idioma…', error: 'Não foi possível salvar o idioma. Tente novamente.', beta: 'Tradução beta' },
  fr: { label: 'Langue', saving: 'Enregistrement de la langue…', error: 'Impossible d’enregistrer la langue. Réessayez.', beta: 'Traduction bêta' },
};
export default function LanguageSelector() {
  const { locale } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <div className="language-selector" translate="no">
    <label htmlFor="codezero-language">{copy[locale].label}</label>
    <select id="codezero-language" value={locale} disabled={busy || pending} onChange={async event => {
      const next = event.target.value;
      setBusy(true); setError(false);
      try {
        const response = await fetch('/api/locale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: next }) });
        if (!response.ok) throw new Error('locale-save-failed');
        startTransition(() => router.refresh());
      } catch { setError(true); } finally { setBusy(false); }
    }}>{LOCALES.map(value => <option key={value} value={value} lang={value}>{LANGUAGE_NAMES[value]}{value==='es'?'':' (beta)'}</option>)}</select>
    {locale!=='es'&&<small className="language-review-state">{copy[locale].beta}</small>}
    <span role="status" aria-live="polite">{error ? copy[locale].error : busy || pending ? copy[locale].saving : ''}</span>
  </div>;
}
