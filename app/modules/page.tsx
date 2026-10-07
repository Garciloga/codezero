import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { workspaceEnabled } from "../../lib/workspace-sandbox";
import { workspaceUser } from "../../lib/workspace-server";
import { ADDON_OFFERS } from "../../lib/modular-offers";
import TutorAddonControl from "../components/tutor-addon-control";
import AddonWaitlistButton from "../components/addon-waitlist-button";
export async function generateMetadata() { return translatedMetadata({title:"Módulos",robots:{index:false,follow:false}}); }
export default async function ModulesPage(){
 if(!workspaceEnabled())notFound(); const session=await workspaceUser();if(!session)redirect("/login");
 const [catalog,interest]=await Promise.all([session.supabase.from("addons").select("key,status"),session.supabase.from("addon_waitlist").select("addon_key").eq("user_id",session.user.id)]);
 const {data:tutorAddon}=await session.supabase.from("account_addons").select("status").eq("user_id",session.user.id).eq("addon_key","ai_tutor").maybeSingle();
 const subscribed=new Set((interest.data??[]).map(x=>x.addon_key));
 return <LocalizedContent><main className="wrap"><h1>Construye tu espacio de aprendizaje</h1><section className="card"><h2>Exámenes y certificados incluidos</h2><p>Los exámenes disponibles se incluyen dentro de la cuota de tu plan. Los diplomas y certificados se emiten sin pago adicional al cumplir los requisitos; no se venden por separado. Al cancelar conservas los documentos ya emitidos.</p><Link href="/certificate">Ver mi certificado</Link></section><p>Elige los módulos que te interesan. Las listas de espera no generan cobros; activaremos cada módulo cuando esté listo.</p>
 {catalog.error||interest.error?<p role="status">No pudimos cargar el catálogo. Intenta nuevamente.</p>:<div className="grid grid2">{ADDON_OFFERS.filter(offer=>offer.key!=="verified_certificate").map(offer=>{const stored=catalog.data?.find(x=>x.key===offer.key)?.status;const status=offer.key==='ai_tutor'&&!process.env.OPENAI_API_KEY?'coming_soon':stored;if(offer.key==='route_customer_success')return <article className="card" key={offer.key}><span className="pill">Incluido en Pro y Enterprise</span><h2>Customer Success</h2><p>Ocho unidades, examen y proyecto final con revisión humana. Certificado incluido al aprobar.</p><Link className="btn" href="/customer-success">Ver curso</Link></article>;return <article className="card" key={offer.key}><span className="pill">{status==='active'?'Disponible':'Próximamente'}</span><h2>{offer.label}</h2><p>{offer.key==='ai_tutor'?'$50 el primer mes y $100 al mes desde el segundo.':`$${offer.cents/100} MXN · ${offer.kind==='monthly'?'mensual':'pago único'}`}</p>{status==='active'&&offer.key==='ai_tutor'?<TutorAddonControl included={session.profile.plan_name==='pro'} active={tutorAddon?.status==='active'}/>:<AddonWaitlistButton addonKey={offer.key} enabled={status==='coming_soon'} initial={subscribed.has(offer.key)}/>}</article>;})}</div>}
 <section className="card"><h2>Kit de empleabilidad incluido</h2><p>Plantillas de CV, entrevista STAR, portafolio y seguimiento de candidaturas para Pro y Enterprise.</p><Link className="btn" href="/employment-kit">Abrir kit</Link></section><p><Link className="btn secondary" href="/dashboard">Volver a Mi CodeZero</Link></p></main></LocalizedContent>;
}


