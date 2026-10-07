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
import { createServerSupabase } from "../../lib/supabase-server";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  return <LocalizedContent><div className="public-site">
    <PublicHeader authenticated={!error && user !== null} />
    {children}
    <footer className="public-footer"><nav aria-label="Información legal y contacto">
      <Link href="/terms">Términos</Link><Link href="/privacy">Privacidad</Link>
      <Link href="/refunds">Cancelaciones y reembolsos</Link><Link href="/contact">Contacto</Link>
    </nav></footer>
  </div></LocalizedContent>;
}

