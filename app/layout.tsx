import { translatedMetadata } from '../lib/localization/metadata';
import "./globals.css";
import SiteVisit from './components/site-visit';
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import {roleTrainingEnabled} from '../lib/role-training-policy';
import VivoShell from "./components/vivo-shell";
import {accountNavigation} from "../lib/organization-server";
import {VIVO_CSS_VARIABLES, VIVO_THEME_CSS} from "../lib/vivo-design";
import type {CSSProperties} from "react";
import type { Metadata } from "next";
import { ReactNode } from "react";
import AppearanceProvider from "./components/appearance-provider";
import LanguageProvider from "./components/localization/provider";
import LocalizedServer from "./components/localization/server";
import { localeContext, uiMessages } from "../lib/localization/server";
import { LANGUAGE_TAGS } from "../lib/localization/shared";
import { workspaceEnabled } from "../lib/workspace-sandbox";

export async function generateMetadata() { return translatedMetadata({
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://codezero-nine.vercel.app"),
  title: {
    default: "Garciloga",
    template: "%s · Garciloga",
  },
  description: "Desarrolla habilidades con programación, cursos y decisiones: desde tus primeros pasos hasta liderazgo y dirección.",
  applicationName: "Garciloga",
  openGraph: {
    title: "Garciloga",
    description: "Aprende, practica y decide: construye tu camino profesional con Garciloga.",
    type: "website",
    locale: "es_MX",
  },
}); }

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { supabase, user, locale } = await localeContext();
  const messages = await uiMessages(locale);
  const navigation = user ? await accountNavigation() : null;
  const preference = user && workspaceEnabled()
    ? (await supabase.from("user_preferences").select("mode,accent,colors").eq("user_id",user.id).maybeSingle()).data : null;
  return (
    <html lang={LANGUAGE_TAGS[locale]} data-design="vivo" style={VIVO_CSS_VARIABLES as CSSProperties}>
      <head><style>{VIVO_THEME_CSS}</style></head>
      <body>
        <SiteVisit/>
        <LanguageProvider locale={locale} messages={messages}>
        <AppearanceProvider userId={user?.id ?? null} serverPreference={preference} />
        <LocalizedServer><a className="skip-link" href="#main-content">Saltar al contenido</a></LocalizedServer>
        <VivoShell userId={user?.id} roleTrainingActive={roleTrainingEnabled()} avatarVersion={navigation?.profile?.avatar_version} authenticated={Boolean(navigation)} name={navigation?.profile?.full_name || "Mi cuenta"} plan={navigation?.profile?.plan_name || "Free"} organizations={(navigation?.organizations ?? []) as any} selected={navigation?.organization?.organization_id ?? null}>{children}</VivoShell>
      </LanguageProvider>
      </body>
    </html>
  );
}

