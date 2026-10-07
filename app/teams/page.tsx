import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { workspaceEnabled } from "../../lib/workspace-sandbox";
import { workspaceUser } from "../../lib/workspace-server";
import { isTestInvitationEmail } from "../../lib/workspace-sandbox";
export const metadata = {title:"Mis equipos",robots:{index:false,follow:false}};
export default async function TeamsPage({searchParams}: {searchParams:Promise<{result?:string}>}) {
  if (!workspaceEnabled()) notFound();
  const context = await workspaceUser();
  if (!context) redirect("/login");
  const {data:organizations,error} = await context.supabase.from("organizations").select("id,name").eq("active",true);
  return <main className="wrap"><h1>Mis equipos</h1><Link href="/dashboard">Volver al panel</Link>
    {(await searchParams).result && <p role="status">No se pudo completar la operación. Revisa tus permisos o la invitación.</p>}
    {error ? <p>No pudimos consultar tus equipos. Intenta nuevamente.</p> : organizations?.length ? <ul>{organizations.map(org=><li key={org.id}><Link href={`/teams/${org.id}`}>{org.name}</Link></li>)}</ul> : <p>Aún no perteneces a una organización.</p>}
    {context.profile.role === "owner" && <section className="card"><h2>Crear organización</h2><form action="/api/teams/manage" method="post"><input type="hidden" name="action" value="create"/><label>Nombre <input name="name" minLength={2} maxLength={120} required/></label>{" "}<button className="btn" type="submit">Crear organización</button></form></section>}
    {context.user.email && isTestInvitationEmail(context.user.email) && <section className="card" style={{marginTop:18}}><h2>Configurar mi contraseña privada de prueba</h2><form action="/api/teams/password" method="post"><label>Contraseña <input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label>{" "}<label>Repite la contraseña <input type="password" name="password_confirmation" minLength={12} maxLength={128} autoComplete="new-password" required/></label>{" "}<button className="btn" type="submit">Guardar mi contraseña</button></form></section>}
  </main>;
}
