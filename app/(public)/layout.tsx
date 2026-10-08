import LocalizedContent from "../components/localization/server";
import type { ReactNode } from "react";
import "@fontsource/jetbrains-mono/latin-500.css";
import Link from "next/link";
import PublicHeader from "../components/public-header";
import { createServerSupabase, getServerUser } from "../../lib/supabase-server";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await getServerUser();
  return <LocalizedContent><div className="public-site">
    <PublicHeader authenticated={!error && user !== null} />
    {children}
    <footer className="public-footer"><nav aria-label="Información legal y contacto">
      <Link prefetch={false} href="/news">Novedades</Link><Link prefetch={false} href="/help">Centro de ayuda</Link><Link prefetch={false} href="/about">Sobre Garciloga</Link><Link prefetch={false} href="/roadmap">Próximamente</Link><Link prefetch={false} href="/terms">Términos</Link><Link prefetch={false} href="/privacy">Privacidad</Link>
      <Link prefetch={false} href="/refunds">Cancelaciones y reembolsos</Link><Link prefetch={false} href="/contact">Contacto</Link>
    </nav></footer>
  </div></LocalizedContent>;
}



