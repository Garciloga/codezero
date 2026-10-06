import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "CodeZero",
  description: "Aprendizaje profesional de programación, SaaS e integraciones."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
