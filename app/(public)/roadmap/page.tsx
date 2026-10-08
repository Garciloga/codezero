import Link from 'next/link';
import LocalizedContent from '../../components/localization/server';
import { translatedMetadata } from '../../../lib/localization/metadata';
import { publicMetadata } from '../../../lib/public-metadata';
import { pendingProductRoadmap, COMMERCIAL_REFERENCES } from '../../../lib/product-roadmap';
import {roleTrainingEnabled} from '../../../lib/role-training-policy';
import {workspaceProductionEnabled} from '../../../lib/workspace-sandbox';
import {codeRuntimeConfiguration} from '../../../lib/code-runtime-policy';
export async function generateMetadata() { return translatedMetadata(publicMetadata('Próximamente', 'Conoce los próximos cursos, mentorías y herramientas de Garciloga.', '/roadmap')); }
export default function RoadmapPage() {
  const training=roleTrainingEnabled(),messaging=workspaceProductionEnabled(),code=Boolean(codeRuntimeConfiguration(process.env));
  const pending=pendingProductRoadmap({companyMessaging:messaging,codePractice:code,roleTraining:training,community:messaging});
  return <LocalizedContent><main className="wrap">
    <section className="public-section"><p className="public-eyebrow">El siguiente paso de Garciloga</p><h1>Lo que viene</h1><p>Construimos habilidades para puestos y procesos: desde cero hasta colaboradores, supervisores, gerentes y directivos.</p><p>Este roadmap muestra funciones planificadas. Todavía no están disponibles para compra y no tienen fecha de lanzamiento confirmada.</p></section>
    <section className="card"><h2>Lo que ya puedes aprender</h2><p>Programación e integraciones en 15 niveles; guías y decisiones introductorias por puesto; curso de Customer Success y kit de empleabilidad para Pro y Enterprise.</p><div className="public-actions"><Link prefetch={false} className="btn" href="/dashboard">Ir a mi aprendizaje</Link><Link prefetch={false} className="btn secondary" href="/leadership">Explorar liderazgo</Link></div></section>
    <section className="public-section card"><h2>Últimos lanzamientos disponibles</h2><ul>{messaging&&<li><Link prefetch={false} href="/community">Comunidad moderada de alumnos</Link>: participación voluntaria con alias, revisión de publicaciones y reportes.</li>}{messaging&&<li><Link prefetch={false} href="/mentoring">Agenda y solicitudes de mentoría</Link>: perfiles y horarios sujetos a aprobación y disponibilidad.</li>}{training&&<li><Link prefetch={false} href="/role-training">Rutas de práctica por puesto, incluidos liderazgo, operaciones, calidad, datos, producto, soluciones y capacitación.</Link> Proyectos y revisión humana según acceso del plan.</li>}{messaging&&<li><Link prefetch={false} href="/teams">Comunicador de compañía</Link>: mensajes dentro de la organización y de los equipos autorizados.</li>}{code&&<li><Link prefetch={false} href="/practice">Práctica ejecutable de Python y SQL</Link>: editor con ejecución aislada y resultados verificables.</li>}</ul></section>
    <div className="grid grid2 public-section">{pending.map(item => <article key={item.key} className="card"><span className="pill">Próximamente</span><h2>{item.label}</h2><p className="muted">{item.audience}</p><p>{item.detail}</p><p>{item.gate}</p>{item.key === 'mentoring' && <p>Precio previsto: ${COMMERCIAL_REFERENCES.mentoringMxn} MXN por {COMMERCIAL_REFERENCES.mentoringMinutes} minutos. Mentoría sobre posiciones y procesos.</p>}</article>)}</div>
    <section className="card"><h2>Ayúdanos a priorizar</h2><p>Desde tu cuenta puedes registrar interés en los módulos del catálogo. Registrarte en una lista de espera no reserva una fecha ni genera cobros.</p><Link prefetch={false} className="btn secondary" href="/modules">Ver módulos y listas de espera</Link></section>
  </main></LocalizedContent>;
}


