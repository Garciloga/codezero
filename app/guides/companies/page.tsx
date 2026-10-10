import Link from "next/link";
import LocalizedContent from "../../components/localization/server";
import PublicHeader from "../../components/public-header";
import {COMPANY_HELP as h} from "../../../lib/company-help-content";
import {translatedMetadata} from "../../../lib/localization/metadata";
import {publicMetadata} from "../../../lib/public-metadata";
export async function generateMetadata(){return translatedMetadata(publicMetadata(h.title,h.intro,"/guides/companies"));}
export default function CompanyGuide(){return <div className="public-site"><PublicHeader authenticated={false}/><LocalizedContent><main className="wrap company-manual">
 <header className="company-manual-hero"><span className="pill">{h.eyebrow}</span><h1>{h.title}</h1><p>{h.intro}</p>
 <div className="grid grid2"><aside className="card"><strong>Disponible según permisos y contrato</strong><p>{h.current}</p></aside><aside className="card"><strong>En desarrollo · Borrador</strong><p>{h.upcoming}</p></aside></div></header>
 <section><h2>Cómo asignar aprendizaje · procedimiento paso a paso</h2><p>Ejemplo ilustrado de la navegación. La ubicación exacta de botones puede variar según el plan y la configuración.</p>
 <ol className="company-manual-steps">{h.steps.map(step=><li className="card" key={step.number}><div className="company-manual-step-count">{step.number}</div><div><h3>{step.title}</h3><div className="company-manual-mini" role="img" aria-label={step.screen}>{step.screen.split(" → ").map((segment,i)=><span key={i}>{i>0&&<b aria-hidden="true">→</b>}<em>{segment}</em></span>)}</div><p>{step.detail}</p><Link prefetch={false} href={step.link}>Ver sección relacionada</Link></div></li>)}</ol>
 </section>
 <section id="catalogo-borradores" aria-label="Programas en preparación"><h2>Los 12 programas y módulos: necesidades y evidencias</h2><p>Fichas editoriales para preparar la formación de una organización. No constituyen cursos matriculables ni certificaciones disponibles.</p>
<div className="grid grid2">{h.modules.map(m=><article className="card" key={m.number}><span className="pill">{m.state}</span><h3>{m.number}. {m.name}</h3><p><strong>Destinatarios:</strong> {m.audience}</p><p><strong>Enfoque:</strong> {m.focus}</p><p><strong>Evidencia:</strong> {m.evidence}</p><p><strong>Límites:</strong> {m.limits}</p></article>)}</div></section>
<section className="card" id="rutas-completas"><span className="pill">Próximamente · Vista de diseño, no funcional</span><h2>Planificar cursos completos según las necesidades del equipo</h2><p>Este proceso está programado únicamente como propuesta en un entorno de pruebas. No crea asignaciones productivas, no otorga diplomas y no activa cursos pendientes.</p>
 <div className="company-manual-preview" aria-label="Ejemplo de configuración de un curso">{h.draftSteps.map((v,i)=><div className="company-manual-preview-row" key={v.title}><span>{i+1}</span><div><strong>{v.title}</strong><p>{v.value}</p><small>{v.explain}</small></div></div>)}</div>
 <p>El sistema previsto exige permisos del servidor, rol válido, pertenencia activa, separación entre compañías y los límites del plan. La evaluación humana y las competencias no se reemplazan por opciones de interfaz.</p></section>
 <section id="preguntas"><h2>Preguntas frecuentes para responsables y clientes</h2><div className="company-manual-faq">{h.faqs.map(({q,a})=><details className="card" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
 <section className="card"><h2>¿Necesitas apoyo con tu equipo?</h2><p>La configuración y la formación deben ajustarse a los roles y condiciones reales de tu organización.</p><div className="public-actions"><Link prefetch={false} className="btn" href="/help">Centro de ayuda</Link><Link prefetch={false} className="btn secondary" href="/contact">Contacto empresarial</Link><Link prefetch={false} className="btn secondary" href="/roadmap">Ver próximos módulos</Link></div></section>
 </main></LocalizedContent></div>}
