import LocalizedDate from '../components/localization/date';
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import CertificateSharing from "../components/certificate-sharing";
import { workspaceEnabled } from "../../lib/workspace-sandbox";

export default async function CertificatePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: certificate } = await supabase
    .from("certificates")
    .select("id, title, issued_at, metadata")
    .eq("user_id", user.id)
    .eq("certificate_type", "codezero-complete")
    .maybeSingle();

  if (!certificate) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const publication = workspaceEnabled() ? (await supabase.from("certificate_publications").select("public_id,status").eq("user_id",user.id).eq("certificate_id",certificate.id).maybeSingle()).data : null;

  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">CERTIFICACIÓN</span>
          <h1>{certificate.title}</h1>
          <p className="muted">Emitido por CodeZero</p>
        </div>
        <Link className="btn secondary" href="/dashboard">Volver a Mi CodeZero</Link>
      </div>

      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <p className="muted">Se certifica que</p>
        <h2 style={{ fontSize: 36, marginBottom: 8 }}>
          <span translate="no">{profile?.full_name || profile?.email || "Estudiante CodeZero"}</span>
        </h2>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          completó satisfactoriamente los 15 niveles de CodeZero,
          incluyendo programación, desarrollo web, APIs, SaaS,
          integraciones empresariales, arquitectura y seguridad.
        </p>
        <p className="muted">
          Fecha de emisión: <LocalizedDate value={certificate.issued_at} />
        </p>
        <p className="muted" style={{ fontSize: 12 }}>
          ID de certificado: {certificate.id}
        </p>
      </div>
      {workspaceEnabled() && <CertificateSharing certificateId={certificate.id} initialPath={publication?.status === "verified" ? `/verify/${publication.public_id}` : null} displayName={profile?.full_name || "Estudiante CodeZero"}/>}
    </main></LocalizedContent>
  );
}


