import { translatedMetadata } from '../lib/localization/metadata';
import "./globals.css";
import "./motion-quality.css";
import "./workspace-layout.css";
import PlatformUsage from './components/platform-usage';
import SupportSessionBanner from './components/support-session-banner';
import {supportSession} from '../lib/support-session';
import SiteVisit from './components/site-visit';
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import {roleTrainingEnabled} from '../lib/role-training-policy';
import VivoShell from "./components/vivo-shell";
import {accountNavigation} from "../lib/organization-server";
import {VIVO_CSS_VARIABLES, VIVO_THEME_CSS} from "../lib/vivo-design";
import type {CSSProperties} from "react";
import type { Metadata } from "next";
import { ReactNode } from "react";
import AppearanceProvider from "./components/appearance-provider";
import LanguageProvider from "./components/localization/section-loader";
import {headers} from "next/headers";
import {messageSection} from "../lib/localization/section";
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
  description: "Formación por puesto · procesos, herramientas y decisiones",
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
  const section=messageSection((await headers()).get('x-garciloga-path')??'/');
  const messages = locale==='es'?{}:(await import(`../lib/localization/sections/${locale}-${section}.json`)).default;
  const support=await supportSession();
  const navigation = user ? await accountNavigation() : null;
  const preference = user && workspaceEnabled()
    ? (await supabase.from("user_preferences").select("mode,accent,colors,news_read").eq("user_id",user.id).maybeSingle()).data : null;
  return (
    <html lang={LANGUAGE_TAGS[locale]} data-design="vivo" style={VIVO_CSS_VARIABLES as CSSProperties}>
      <head><style>{VIVO_THEME_CSS}</style></head>
      <body>
        <SiteVisit/>
        <PlatformUsage userId={user?.id??null} enabled={Boolean(user)&&workspaceEnabled()&&!support&&navigation?.profile?.role!=='owner'}/>
        <LanguageProvider section={section} locale={locale} messages={messages}>
        {support&&<SupportSessionBanner expires={support.expires}/>}
        <AppearanceProvider userId={user?.id ?? null} serverPreference={preference} />
        <LocalizedServer><a className="skip-link" href="#main-content">Saltar al contenido</a></LocalizedServer>
        <VivoShell operatorRole={navigation?.profile?.role} newsRead={preference?.news_read??null} userId={user?.id} roleTrainingActive={roleTrainingEnabled()} avatarVersion={navigation?.profile?.avatar_version} authenticated={Boolean(navigation)} name={navigation?.profile?.full_name || "Mi cuenta"} plan={navigation?.profile?.plan_name || "Free"} organizations={(navigation?.organizations ?? []) as any} selected={navigation?.organization?.organization_id ?? null}>{children}</VivoShell>
      </LanguageProvider>
      </body>
    </html>
  );
}



