import { translatedMetadata } from '../lib/localization/metadata';
import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import AppearanceProvider from "./components/appearance-provider";
import LanguageProvider from "./components/localization/provider";
import LanguageSelector from "./components/localization/language-selector";
import LocalizedServer from "./components/localization/server";
import { localeContext, uiMessages } from "../lib/localization/server";
import { LANGUAGE_TAGS } from "../lib/localization/shared";
import { workspaceEnabled } from "../lib/workspace-sandbox";

export async function generateMetadata() { return translatedMetadata({
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://codezero-nine.vercel.app"),
  title: {
    default: "CodeZero",
    template: "%s · CodeZero",
  },
  description: "Aprende programación, SaaS e integraciones con una ruta práctica y progresiva.",
  applicationName: "CodeZero",
  openGraph: {
    title: "CodeZero",
    description: "De cero a construir y entender soluciones técnicas para SaaS.",
    type: "website",
    locale: "es_MX",
  },
}); }

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { supabase, user, locale } = await localeContext();
  const messages = await uiMessages(locale);
  const preference = user && workspaceEnabled()
    ? (await supabase.from("user_preferences").select("mode,accent").eq("user_id",user.id).maybeSingle()).data : null;
  return (
    <html lang={LANGUAGE_TAGS[locale]}>
      <body>
        <LanguageProvider locale={locale} messages={messages}>
        <AppearanceProvider userId={user?.id ?? null} serverPreference={preference} />
        <LanguageSelector />
        <LocalizedServer><a className="skip-link" href="#main-content">Saltar al contenido</a></LocalizedServer>
        <div id="main-content">{children}</div>
      </LanguageProvider>
      </body>
    </html>
  );
}

