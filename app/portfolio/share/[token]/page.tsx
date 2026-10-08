import {notFound} from 'next/navigation';
import {publicPortfolio} from '../../../../lib/portfolio-server';
import {isUuid} from '../../../../lib/workspace-sandbox';
import {findTrainingActivity} from '../../../../lib/role-training-content';
import LocalizedContent from '../../../components/localization/server';
export const dynamic='force-dynamic';
export const metadata={title:'Portafolio · Garciloga',robots:{index:false,follow:false}};
export default async function SharedPortfolio({params}:{params:Promise<{token:string}>}){const {token}=await params;if(!isUuid(token))notFound();const p=await publicPortfolio(token);if(!p)notFound();return <LocalizedContent><main className="wrap"><h1>Portafolio · Garciloga</h1><h2 translate="no">{p.displayName}</h2><p>Selección voluntaria de práctica simulada con revisión humana. No acredita desempeño laboral ni garantiza empleo.</p><section className="card"><h2>Proyectos personales aprobados</h2><ul>{p.projects.map((e,i)=><li key={i}>{findTrainingActivity(e.key)?.title??'Proyecto personal'} · {e.date}</li>)}</ul></section><section className="card"><h2>Competencias con evidencia</h2><ul>{p.competencies.map(c=><li key={c.key}>{c.name} · {c.level}/4</li>)}</ul></section><section className="card"><h2>Certificados personales</h2><ul>{p.certificates.map((c,i)=><li key={i}>{c.title} · {c.date}</li>)}</ul></section></main></LocalizedContent>;}
