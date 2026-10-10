import Link from "next/link";
import {redirect} from "next/navigation";
import LocalizedContent from "../components/localization/server";
import AddonWaitlistButton from "../components/addon-waitlist-button";
import {workspaceUser} from "../../lib/workspace-server";
import {TECHNICAL_ADDON_OFFERS,technicalLegacyAccess} from "../../lib/technical-addon-offers";
import {translatedMetadata} from "../../lib/localization/metadata";

export async function generateMetadata(){return translatedMetadata({title:"Programación · complemento técnico",robots:{index:false,follow:false}});}
export default async function TechnicalAddon(){
 const session=await workspaceUser();if(!session)redirect("/login");
 const [catalogResult,interests]=await Promise.all([
  session.supabase.from("addons").select("key,status").in("key",TECHNICAL_ADDON_OFFERS.map(o=>o.key)),
  session.supabase.from("addon_waitlist").select("addon_key").eq("user_id",session.user.id),
 ]);
 const catalog=new Map((catalogResult.data??[]).map(x=>[x.key,x.status]));
 const subscribed=new Set((interests.data??[]).map(x=>x.addon_key));
 const legacy=technicalLegacyAccess(session.profile.plan_name,session.profile.role);
 return <LocalizedContent><main className="wrap technical-addon-hub">
  <header className="technical-addon-intro"><span className="pill">Especialización técnica opcional</span><h1>Programación, automatización e integraciones</h1>
   <p>Complementa la formación por puesto con habilidades técnicas. Esta especialización no condiciona el avance ni los exámenes de tus programas profesionales.</p>
  </header>
  <section className="card" aria-label="Acceso técnico actual"><h2>Tu acceso actual no cambia</h2>
   <p>{legacy?"Tu plan actual conserva acceso a los quince niveles de programación con sus cuotas vigentes. No necesitas comprar otro complemento.":"Puedes continuar el primer nivel de programación sin contratar un complemento adicional."}</p>
   <div className="public-actions"><Link className="btn" prefetch={false} href="/learn/1">Continuar mi aprendizaje</Link><Link className="btn secondary" prefetch={false} href="/practice">Explorar prácticas</Link></div>
  </section>
  <section className="technical-pricing" aria-labelledby="technical-prices-title"><h2 id="technical-prices-title">Precios aprobados · inscripción de interés</h2>
   <p className="muted">Estos precios todavía no generan cobros. La activación requiere validar alcance académico, derechos actuales, comprobantes, permisos y pagos de Stripe. No hay una fecha prometida.</p>
   <div className="grid grid3 technical-tier-grid">{TECHNICAL_ADDON_OFFERS.map(offer=>
    <article className="card" key={offer.key}>
     <span className="pill">Próximamente</span><h3>{offer.label}</h3>
     <p className="technical-tier-price">${offer.priceCents/100} <small>MXN / {offer.unit} / mes</small></p>
     <p>{offer.detail}</p>
     <p className="muted">{offer.minimumSeats>1?"Mínimo "+offer.minimumSeats+" personas. Cotización base independiente.":"Oferta individual. Sin pago por registrar interés."}</p>
     {catalogResult.error||interests.error?<p role="status">Lista de espera temporalmente no disponible.</p>:
      <AddonWaitlistButton addonKey={offer.key} enabled={catalog.get(offer.key)==="coming_soon"} initial={subscribed.has(offer.key)}/>}
    </article>
   )}</div>
  </section>
  <p><Link className="btn secondary" href="/modules">Ver otros complementos</Link></p>
 </main></LocalizedContent>;
}
