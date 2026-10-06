import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email,full_name,role,plan_name,status,created_at")
    .eq("id", user.id)
    .single();

  const { data: certificate } = await supabase
    .from("certificates")
    .select("id,title,issued_at")
    .eq("user_id", user.id)
    .eq("certificate_type", "codezero-complete")
    .maybeSingle();

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">PERFIL</span>
          <h1>Mi cuenta</h1>
          <p className="muted">Consulta tu cuenta y estado de aprendizaje.</p>
        </div>
        <Link className="btn secondary" href="/dashboard">Volver a Mi CodeZero</Link>
      </div>

      <div className="grid grid2">
        <section className="card">
          <h2>Datos</h2>
          <p><b>Nombre:</b> {profile?.full_name || "Sin configurar"}</p>
          <p><b>Email:</b> {profile?.email || user.email}</p>
          <p><b>Rol:</b> {profile?.role}</p>
        </section>

        <section className="card">
          <h2>Suscripción</h2>
          <p><b>Plan:</b> {profile?.plan_name}</p>
          <p><b>Estado:</b> {profile?.status}</p>

          {profile?.plan_name && profile.plan_name !== "free" ? (
            <form action="/api/stripe/portal" method="post" style={{ marginTop: 20 }}>
              <button className="btn secondary" type="submit">
                Administrar suscripción
              </button>
            </form>
          ) : (
            <div style={{ marginTop: 20 }}>
              <Link className="btn secondary" href="/pricing">
                Ver planes
              </Link>
            </div>
          )}

          {certificate && (
            <div style={{ marginTop: 20 }}>
              <span className="pill">CERTIFICACIÓN</span>
              <p>{certificate.title}</p>
              <Link className="btn secondary" href="/certificate">Ver certificado</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
