import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { workspaceEnabled, isUuid } from "../../../lib/workspace-sandbox";
import { workspaceUser } from "../../../lib/workspace-server";
export async function generateMetadata() { return translatedMetadata({title:"Incorporarme a un equipo",robots:{index:false,follow:false}}); }
export default async function JoinPage({searchParams}: {searchParams:Promise<{id?:string}>}) {
  if (!workspaceEnabled()) notFound();
  const {id} = await searchParams;
  if (!isUuid(id)) notFound();
  const context = await workspaceUser();
  if (!context) return <LocalizedContent><main className="wrap"><h1>Incorporarme a un equipo</h1><p>Inicia sesión con el correo de la invitación y vuelve a abrir este enlace.</p><Link className="btn" href="/login">Iniciar sesión</Link></main></LocalizedContent>;
  return <LocalizedContent><main className="wrap"><h1>Incorporarme a un equipo</h1><p>La invitación debe estar vigente y coincidir con tu correo verificado. Tu contraseña es privada; no se comparte con el manager.</p><form action="/api/teams/accept" method="post"><input type="hidden" name="invitation_id" value={id}/><label>Nombre para tu equipo <input name="display_name" defaultValue={context.profile.full_name ?? ""} maxLength={120} required/></label>{" "}<button className="btn" type="submit">Aceptar invitación</button></form></main></LocalizedContent>;
}

