import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import AppearanceSettings from "../components/appearance-settings";
import { workspaceEnabled } from "../../lib/workspace-sandbox";

type PageProps = { searchParams: Promise<{ updated?: string }> };

export default async function ProfilePage({ searchParams }: PageProps) {
  const { updated } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email,full_name,role,plan_name,status,billing_status,stripe_customer_id,stripe_cancel_at_period_end,created_at")
    .eq("id", user.id)
    .single();

  const { data: certificate } = await supabase
    .from("certificates")
    .select("id,title,issued_at")
    .eq("user_id", user.id)
    .eq("certificate_type", "codezero-complete")
    .maybeSingle();

  const cloudAppearance = workspaceEnabled();
  const appearance = cloudAppearance
    ? (await supabase.from("user_preferences").select("mode,accent").eq("user_id",user.id).maybeSingle()).data : null;
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

      {updated === "1" && (
        <div className="card" style={{marginBottom:18}}>
          <b>Perfil actualizado.</b>
        </div>
      )}
      {updated === "invalid" && (
        <div className="card" style={{marginBottom:18}}>
          <b>Escribe un nombre de entre 2 y 100 caracteres.</b>
        </div>
      )}
      {updated === "error" && (
        <div className="card" style={{marginBottom:18}}>
          <b>No pudimos actualizar tu perfil en este momento.</b>
        </div>
      )}

      <div className="grid grid2">
        <section className="card">
          <h2>Datos</h2>
          <p><b>Nombre:</b> {profile?.full_name || "Sin configurar"}</p>
          <p><b>Email:</b> {profile?.email || user.email}</p>
          <p><b>Rol:</b> {profile?.role}</p>

          <form action="/api/profile/update" method="post" style={{display:"grid",gap:10,marginTop:20}}>
            <label htmlFor="full_name"><b>Nombre para tu perfil y certificado</b></label>
            <input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              minLength={2}
              maxLength={100}
              required
              placeholder="Tu nombre"
              style={{padding:10,borderRadius:10,border:"1px solid #d8dee8"}}
            />
            <button className="btn secondary" type="submit">Guardar nombre</button>
          </form>
        </section>

        <section className="card">
          <h2>Suscripción</h2>
          <p><b>Plan:</b> {profile?.plan_name}</p>
          <p><b>Estado de cuenta:</b> {profile?.status}</p>
          {profile?.plan_name !== "free" && (
            <p><b>Estado de facturación:</b> {profile?.billing_status ?? "pendiente"}</p>
          )}
          {profile?.stripe_cancel_at_period_end && (
            <p className="muted">Cancelación programada al finalizar el periodo vigente.</p>
          )}

          {profile?.plan_name && profile.plan_name !== "free" && profile.stripe_customer_id ? (
            <form action="/api/stripe/portal" method="post" style={{ marginTop: 20 }}>
              <button className="btn secondary" type="submit">
                Administrar suscripción
              </button>
            </form>
          ) : profile?.plan_name && profile.plan_name !== "free" ? (
            <p className="muted" style={{ marginTop: 20 }}>
              Este acceso fue asignado sin una suscripción de Stripe. Para cambios de plan, contacta soporte.
            </p>
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

      <AppearanceSettings userId={user.id} initialPreference={appearance} syncEnabled={cloudAppearance} />
      {cloudAppearance && <p><Link className="btn secondary" href="/teams">Mis equipos y organigrama</Link></p>}
      <div className="card" style={{marginTop:18}}>
        <h2>Privacidad y soporte</h2>
        <p className="muted">
          Puedes descargar una copia de tus datos de cuenta y aprendizaje. Para correcciones,
          eliminación u otras solicitudes relacionadas con tus datos, escribe a
          {" "}<a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a>.
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Link className="btn secondary" href="/help">Centro de ayuda</Link>
          <Link className="btn secondary" href="/help/tickets">Mis tickets</Link>
          <a className="btn secondary" href="/api/profile/export">Descargar mis datos</a>
        </div>
      </div>
    </main>
  );
}
