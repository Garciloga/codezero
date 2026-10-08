import { translatedMetadata } from '../../../lib/localization/metadata';
import type { ReactNode } from "react";
import { publicMetadata } from "../../../lib/public-metadata";

export async function generateMetadata() { return translatedMetadata(publicMetadata("Entrar o crear cuenta", "Accede a Garciloga o crea tu cuenta para empezar gratis con el Nivel 1.", "/login")); }

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}

