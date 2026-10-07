import type { ReactNode } from "react";
import { publicMetadata } from "../../../lib/public-metadata";

export const metadata = publicMetadata("Entrar o crear cuenta", "Accede a CodeZero o crea tu cuenta para empezar gratis con el Nivel 1.", "/login");

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
