import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { createServerSupabase } from "../lib/supabase-server";
import AppearanceProvider from "./components/appearance-provider";
import { workspaceEnabled } from "../lib/workspace-sandbox";

export const metadata: Metadata = {
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
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const preference = user && workspaceEnabled()
    ? (await supabase.from("user_preferences").select("mode,accent").eq("user_id",user.id).maybeSingle()).data : null;
  return (
    <html lang="es-MX">
      <body>
        <AppearanceProvider userId={user?.id ?? null} serverPreference={preference} />
        <a className="skip-link" href="#main-content">Saltar al contenido</a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
