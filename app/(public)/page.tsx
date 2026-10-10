import {publishedCatalogCounts} from '../../lib/published-catalog-server';
import CompanyDemo from '../components/company-demo';
import {PUBLIC_JOB_CASES} from '../../lib/public-job-cases';
import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { publicMetadata } from "../../lib/public-metadata";
export async function generateMetadata() { return translatedMetadata(publicMetadata("Construye tu camino profesional desde cero", "Formación por puesto · procesos, herramientas y decisiones", "/")); }
const foundation = ["Pensamiento computacional", "Python desde cero", "Python intermedio y código limpio", "Algoritmos y estructuras de datos", "Git, terminal y flujo profesional", "Bases de datos y SQL", "Web: HTML + CSS + JavaScript", "Backend y APIs", "Ingeniería de software", "Capstone · Proyecto profesional"];
const integrations = ["APIs y webhooks", "SaaS, OAuth y automatización", "Sistemas empresariales", "Arquitectura y seguridad", "Proyecto final de integración"];
// Approved manual snapshot, verified against published catalog on 2026-10-06.
export default async function Home() {
  const counts=await publishedCatalogCounts();
  return <LocalizedContent><main className="wrap public-home">
    <section className="public-hero">
      <div>
        <h1>Aprende para el trabajo real. Crece hacia lo que sigue.</h1>
        <p>Empieza por tu puesto y su diagnóstico. Practica procesos, herramientas y decisiones para crecer hacia supervisión, gerencia y dirección. Programación e integraciones son una ruta técnica opcional.</p>
        <p className="muted">Practica Customer Success, Onboarding, Soporte y gestión de cuentas con datos ficticios, decisiones y revisión humana según tu plan.</p>
        <div className="public-actions"><Link className="btn accent" href="/login?modo=registro">Empezar gratis</Link><Link className="btn secondary" href="/programas">Ver programas por puesto</Link></div>
        <p className="muted">Diagnóstico inicial disponible sin completar programación.</p>
      </div>
      <aside className="card public-example garciloga-3d-card" aria-label="Ejemplo de un ejercicio respondido">
        <p className="public-eyebrow">Decisión de Customer Success</p>
        <span className="pill">Ejemplo respondido</span>
        <h2>El reporte bajó de cinco a tres días. ¿Qué comunicas?</h2>
        <ul className="example-options">
          <li>Resolver todo de una vez</li><li className="example-correct"><b>Respuesta correcta:</b> Mejora observada de 40%; la meta de dos días sigue pendiente.</li><li>Eliminar requisitos</li><li>Copiar una solución</li>
        </ul>
        <p className="example-feedback"><b>Correcto.</b> Una observación con su fórmula permite decidir sin prometer resultados no demostrados.</p>
      </aside>
    </section>
    <section className="public-section public-value-section"><h2>Qué es Garciloga y para qué sirve</h2><p className="muted">Una plataforma de aprendizaje laboral para personas y equipos que transforma situaciones del puesto en decisiones, evidencias y competencias.</p><div className="grid grid3"><article className="card"><span className="public-step-number">01</span><h3>Aprende según tu puesto</h3><p>Explora nueve programas y diagnostica qué necesitas reforzar. No es necesario estudiar programación.</p></article><article className="card"><span className="public-step-number">02</span><h3>Demuestra cómo decides</h3><p>Practica casos, explica tu razonamiento y entrega evidencias. La dificultad aumenta con cada nivel.</p></article><article className="card"><span className="public-step-number">03</span><h3>Crece con evidencia</h3><p>Recibe retroalimentación y seguimiento de competencias. Los líderes ven el desarrollo dentro de sus permisos.</p></article></div></section>
    <section className="public-section"><h2>Elige tu camino</h2><div className="public-paths">{[["Quiero crecer en mi puesto","Nueve programas con niveles, proyectos y decisiones por puesto.","/programas"],["Quiero aprender a programar","Ruta técnica opcional: Python, SQL e integraciones.","/technical-addon"],["Quiero formar a mi equipo","Competencias, refuerzos y seguimiento dentro de cada compañía.","/companies"]].map(([title,text,href])=><article key={title}><h3>{title}</h3><p>{text}</p><Link className="btn secondary" href={href}>Explorar</Link></article>)}</div></section>
    <section className="public-section"><h2>Practica tu trabajo</h2><ul className="job-cases">{PUBLIC_JOB_CASES.map(unit=><li key={unit.key}><h3>{unit.title}</h3><p>{unit.caseTitle}</p><Link href={'/role-training/mixed?unit='+unit.key}>Explorar el caso</Link></li>)}</ul><aside className="job-answer"><span className="pill">Decisión respondida · Cuenta Faro</span><h3>Dos usuarios no pueden exportar. ¿Qué confirmas primero?</h3><p>Respuesta: compara permisos, pasos y alcance con una cuenta que sí funciona. Un error aislado no demuestra una caída general.</p></aside></section>
    {counts&&<section className="public-stats" aria-label="Catálogo publicado">{[[counts.levels,"niveles técnicos"],[counts.lessons,"lecciones publicadas"],[counts.technicalProjects,"proyectos técnicos"],[counts.roleProjects,"integradores por ruta"]].map(([n,label])=><div key={String(label)}><strong>{n}</strong><span>{label}</span></div>)}</section>}
    <section id="como-funciona" className="public-section">
      <h2>Así se avanza en Garciloga</h2><p className="muted">Lección, práctica, decisiones, proyecto revisado y evidencia. Cada recorrido conserva sus requisitos.</p>
      <div className="public-steps">
        {[["Lee la lección", "Texto claro, un ejemplo guiado y una lista para comprobar que entendiste."], ["Practica", "Dos ejercicios por lección. Al responder ves la explicación, aciertes o no."], ["Presenta el examen", "Decisiones, casos y evidencias que aumentan su complejidad según el programa."], ["Construye un proyecto", "Entrega proyectos integradores y recibe validación de evidencias según la ruta."]].map(([title, text], i) => <article className="card" key={title}><span className="public-step-number">{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>
    <section className="public-section"><h2>Para líderes de equipo</h2><p>Detecta fortalezas y necesidades de refuerzo usando evidencia de práctica revisada.</p><CompanyDemo compact/><Link className="btn secondary" href="/companies">Para empresas</Link></section>
    <section id="ruta" className="public-section">
      <h2>Ruta técnica opcional</h2><p className="muted">Programación e integraciones se conservan como apoyo adicional. No bloquean el avance de la formación por puesto.</p>
      <div className="public-route-grid">
        <article className="card"><p className="public-eyebrow">Niveles 1 a 10</p><h3>Etapa 1 · Fundamentos</h3><ol>{foundation.map(title => <li key={title}>{title}</li>)}</ol></article>
        <article className="public-dark"><p className="public-eyebrow">Niveles 11 a 15</p><h3>Etapa 2 · Integraciones</h3><ol start={11}>{integrations.map(title => <li key={title}>{title}</li>)}</ol></article>
      </div>
    </section>
    <section className="public-section">
      <h2>¿Para quién es?</h2><div className="public-audience">
        {[["Empiezas de cero", "Nunca has trabajado en ese puesto. Empieza por sus procesos y decisiones, con un diagnóstico que recomienda dónde reforzar."], ["Trabajas en SaaS", "Customer Success, Onboarding o soporte, y quieres entender la parte técnica de tu producto."], ["Buscas especializarte", "Apuntas a Integraciones o Solutions Engineering: APIs, OAuth, webhooks y sistemas empresariales."]].map(([title, text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div><p className="notice">¿Tienes menos de 18 años? Puedes registrarte con la autorización de tu madre, padre o tutor.</p>
    </section>
    <section className="public-section card"><h2>Tu desarrollo, de cero a liderazgo</h2><p>Aprende un proceso, practica una decisión y prepara un entregable. Explora rutas por puesto, casos semanales, comunidad y solicitudes de mentoría. Los equipos cuentan con seguimiento de competencias y mensajes según su contrato.</p><div className="public-actions"><Link prefetch={false} className="btn" href="/leadership">Explorar liderazgo y procesos</Link><Link prefetch={false} className="btn secondary" href="/roadmap">Ver lo que viene</Link></div></section>
    <section id="preguntas" className="public-section public-faq">
      <h2>Preguntas frecuentes</h2>
      <details open><summary>¿Necesito saber programar?</summary><p>No. Elige un puesto y empieza por sus situaciones y competencias. La programación es una ruta técnica opcional.</p></details>
      <details><summary>¿Cuánto cuesta?</summary><p>El Nivel 1 es gratis. Consulta los precios y los límites vigentes en <Link href="/pricing">Precios</Link>.</p></details>
      <details><summary>¿Puedo cancelar cuando quiera?</summary><p>Sí. Conservas tu plan hasta el final del periodo pagado. Los detalles están en <Link href="/refunds">Cancelaciones y reembolsos</Link>.</p></details>
      <details><summary>¿Dónde puedo pedir ayuda?</summary><p>Visita el <Link href="/help">Centro de ayuda</Link> o consulta nuestras opciones de <Link href="/contact">Contacto</Link>.</p></details>
    </section>
    <section className="public-close"><h2>Empieza hoy tu camino profesional, sin costo de registro.</h2><Link className="btn accent" href="/login?modo=registro">Empezar gratis</Link></section>
  </main></LocalizedContent>;
}


