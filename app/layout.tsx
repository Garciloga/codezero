import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#main-content">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
