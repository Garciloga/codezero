import Link from "next/link";
import {redirect} from "next/navigation";
import {getServerUser} from "../../lib/supabase-server";
import LocalizedContent from "../components/localization/server";
import {translatedMetadata} from "../../lib/localization/metadata";

export async function generateMetadata(){return translatedMetadata({title:"Programación · complemento técnico",robots:{index:false,follow:false}});}
export default async function TechnicalAddon(){
 const {data:{user}}=await getServerUser();
 if(!user)redirect("/login");
 return <LocalizedContent><main className="wrap technical-addon-hub">
  <header className="technical-addon-intro"><span className="pill">Ruta técnica opcional</span>
   <h1>Programación, automatización e integraciones</h1>
   <p>Complementa tu formación profesional con habilidades técnicas a tu ritmo. Esta ruta es independiente de los exámenes y certificados por puesto: puedes completar tu trayectoria laboral sin estudiar programación.</p>
  </header>
  <div className="grid grid2 technical-addon-choices">
   <section className="card"><h2>Aprende a programar</h2><p>Quince niveles progresivos con lecciones, prácticas, proyectos y exámenes según tu plan.</p><Link className="btn" prefetch={false} href="/learn/1">Continuar ruta técnica</Link></section>
   <section className="card"><h2>Prácticas de código</h2><p>Explora los entornos y ejercicios disponibles para aplicar Python, SQL e integraciones a situaciones laborales.</p><Link className="btn secondary" prefetch={false} href="/practice">Explorar práctica</Link></section>
  </div>
  <section className="card technical-addon-notice"><h2>Complemento comercial separado: en preparación</h2><p>La ruta técnica sigue incluida en los accesos vigentes de cada plan. Separar su facturación requerirá definir precio, derechos existentes y pruebas de Stripe; no hay un cargo adicional activo.</p><Link className="btn secondary" href="/modules">Ver otros módulos</Link></section>
 </main></LocalizedContent>;
}
