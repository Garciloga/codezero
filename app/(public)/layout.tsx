import LocalizedContent from "../components/localization/server";
import type { ReactNode } from "react";
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-700.css";
import "@fontsource/figtree/latin-400.css";
import "@fontsource/figtree/latin-500.css";
import "@fontsource/figtree/latin-600.css";
import "@fontsource/figtree/latin-700.css";
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
      <Link prefetch={false} href="/terms">Términos</Link><Link prefetch={false} href="/privacy">Privacidad</Link>
      <Link prefetch={false} href="/refunds">Cancelaciones y reembolsos</Link><Link prefetch={false} href="/contact">Contacto</Link>
    </nav></footer>
  </div></LocalizedContent>;
}

