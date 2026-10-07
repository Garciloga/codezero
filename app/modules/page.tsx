import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { workspaceEnabled } from "../../lib/workspace-sandbox";
import { workspaceUser } from "../../lib/workspace-server";
import { ADDON_OFFERS } from "../../lib/modular-offers";
import AddonWaitlistButton from "../components/addon-waitlist-button";
export const metadata={title:"Módulos",robots:{index:false,follow:false}};
export default async function ModulesPage(){
 if(!workspaceEnabled())notFound(); const session=await workspaceUser();if(!session)redirect("/login");
 const [catalog,interest]=await Promise.all([session.supabase.from("addons").select("key,status"),session.supabase.from("addon_waitlist").select("addon_key").eq("user_id",session.user.id)]);
 const subscribed=new Set((interest.data??[]).map(x=>x.addon_key));
 return <main className="wrap"><h1>Construye tu espacio de aprendizaje</h1><p>Elige los módulos que te interesan. Las listas de espera no generan cobros; activaremos cada módulo cuando esté listo.</p>
 {catalog.error||interest.error?<p role="status">No pudimos cargar el catálogo. Intenta nuevamente.</p>:<div className="grid grid2">{ADDON_OFFERS.map(offer=>{const status=catalog.data?.find(x=>x.key===offer.key)?.status;return <article className="card" key={offer.key}><span className="pill">{status==='active'?'Disponible':'Próximamente'}</span><h2>{offer.label}</h2><AddonWaitlistButton addonKey={offer.key} enabled={status==='coming_soon'} initial={subscribed.has(offer.key)}/></article>;})}</div>}
 <p><Link className="btn secondary" href="/dashboard">Volver a Mi CodeZero</Link></p></main>;
}
