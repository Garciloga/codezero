import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { workspaceEnabled } from "../../lib/workspace-sandbox";
import {accountNavigation} from '../../lib/organization-server';
import { workspaceUser } from "../../lib/workspace-server";
import { isTestInvitationEmail } from "../../lib/workspace-sandbox";
export async function generateMetadata() { return translatedMetadata({title:"Mis equipos",robots:{index:false,follow:false}}); }
export default async function TeamsPage({searchParams}: {searchParams:Promise<{result?:string}>}) {
  if (!workspaceEnabled()) notFound();
  const account=await accountNavigation();

  const context = await workspaceUser();
  if (!context) redirect("/login");
  const {data:organizations,error} = await context.supabase.from("organizations").select("id,name").eq("active",true);
  return <LocalizedContent><main className="wrap"><h1>Mis equipos</h1><Link href="/dashboard">Volver al panel</Link>
    {(await searchParams).result && <p role="status">No se pudo completar la operación. Revisa tus permisos o la invitación.</p>}
    {error ? <p>No pudimos consultar tus equipos. Intenta nuevamente.</p> : organizations?.length ? <ul>{organizations.map(org=><li key={org.id}><Link href={`/teams/${org.id}`}><span translate="no">{org.name}</span></Link></li>)}</ul> : <p>Aún no perteneces a una organización.</p>}
    {['owner','admin'].includes(context.profile.role)&&<p><Link href="/admin/companies">Administrar compañías y contratos</Link></p>}
    {context.user.email && isTestInvitationEmail(context.user.email) && <section className="card" style={{marginTop:18}}><h2>Configurar mi contraseña privada de prueba</h2><form action="/api/teams/password" method="post"><label>Contraseña <input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label>{" "}<label>Repite la contraseña <input type="password" name="password_confirmation" minLength={12} maxLength={128} autoComplete="new-password" required/></label>{" "}<button className="btn" type="submit">Guardar mi contraseña</button></form></section>}
  </main></LocalizedContent>;
}

