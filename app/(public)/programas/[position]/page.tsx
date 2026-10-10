import Link from "next/link";
import {notFound} from "next/navigation";
import published from "../../../../lib/position-curricula/published.json";
import {positionProgram,positionProgramTotals} from "../../../../lib/position-curriculum";
import {localeContext} from "../../../../lib/localization/server";
import LocalizedContent from "../../../components/localization/server";
import {translatedMetadata} from "../../../../lib/localization/metadata";
import {publicMetadata} from "../../../../lib/public-metadata";
type Props={params:Promise<{position:string}>};
export function generateStaticParams(){return published.map(x=>({position:x.key}));}
export async function generateMetadata({params}:Props){const {position}=await params,x=published.find(y=>y.key===position);return x?translatedMetadata(publicMetadata(x.title+" · formación profesional","Temario de 15 niveles de "+x.title+" en Garciloga.","/programas/"+x.key)):{title:"Programa no encontrado",robots:{index:false,follow:false}};}
export default async function PublicProgram({params}:Props){
 const {position}=await params,p=positionProgram(position),entry=published.find(x=>x.key===position);if(!p||!entry)notFound();
 const {locale}=await localeContext(),totals=positionProgramTotals(p),local=(v:Record<string,string>)=>v[locale]||v.es;
 return <LocalizedContent><main className="wrap program-detail">
 <nav aria-label="Volver al catálogo"><Link href="/programas">← Todos los programas</Link></nav>
 <header className="program-catalog-header"><span className="pill">Formación profesional</span><h1>{entry.title}</h1><p>Aprende las decisiones y herramientas del puesto, practica con casos y avanza con evidencias verificables según los requisitos de tu plan.</p>
 <div className="program-quick-facts"><span>{totals.levels} niveles</span><span>{totals.lessons} lecciones</span><span>{totals.projects} proyectos</span></div>
 <div className="public-actions"><Link className="btn accent" href={"/login?modo=registro&position="+encodeURIComponent(p.key)}>Inscribirme en {entry.title}</Link><Link className="btn secondary" href="/pricing">Planes y límites</Link></div></header>
 <section className="program-syllabus"><h2>Temario por nivel</h2><p className="muted">Aquí mostramos títulos y estructura, no preguntas ni respuestas de exámenes.</p>
 <div className="grid grid2">{p.levels.map(l=><article className="card" key={l.number}><span className="program-level">Nivel {l.number}</span><h3>{local(l.title)}</h3><ul>{p.lessons.filter(x=>x.level===l.number).map(item=><li key={item.key}>{local(item.title)}</li>)}</ul>{p.projects.some(x=>x.level===l.number)&&<p className="program-project-label">Incluye proyecto integrador</p>}</article>)}</div></section>
 <section className="card program-catalog-cta"><h2>Elige tu puesto y comienza</h2><p>Al registrarte tendrás preseleccionado este programa. Podrás cambiarlo después; programación es un complemento opcional.</p><Link className="btn" href={"/login?modo=registro&position="+encodeURIComponent(p.key)}>Comenzar con {entry.title}</Link></section>
 </main></LocalizedContent>;
}