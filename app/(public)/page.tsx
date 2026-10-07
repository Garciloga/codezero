import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { publicMetadata } from "../../lib/public-metadata";
export async function generateMetadata() { return translatedMetadata(publicMetadata("Aprende a programar desde cero", "Una ruta guiada de programación, SaaS e integraciones. El Nivel 1 completo es gratis.", "/")); }
const foundation = ["Pensamiento computacional", "Python desde cero", "Python intermedio y código limpio", "Algoritmos y estructuras de datos", "Git, terminal y flujo profesional", "Bases de datos y SQL", "Web: HTML + CSS + JavaScript", "Backend y APIs", "Ingeniería de software", "Capstone · Proyecto profesional"];
const integrations = ["APIs y webhooks", "SaaS, OAuth y automatización", "Sistemas empresariales", "Arquitectura y seguridad", "Proyecto final de integración"];
// Approved manual snapshot, verified against published catalog on 2026-10-06.
export default function Home() {
  return <LocalizedContent><main className="wrap public-home">
    <section className="public-hero">
      <div>
        <p className="public-eyebrow">Programación · SaaS · Integraciones</p>
        <h1>Aprende a programar desde cero, paso a paso.</h1>
        <p>Una sola ruta guiada de 15 niveles: lees una lección corta, practicas, presentas el examen y avanzas. Sin conocimientos previos.</p>
        <p className="muted">Aprende a tu ritmo con texto y ejemplos que puedes consultar desde el celular, sin depender de reproducir videos.</p>
        <div className="public-actions"><Link className="btn" href="/login?modo=registro">Empezar gratis</Link><Link className="btn secondary" href="#ruta">Ver la ruta completa</Link></div>
        <p className="muted">El Nivel 1 completo es gratis.</p>
      </div>
      <aside className="card public-example" aria-label="Ejemplo de un ejercicio respondido">
        <p className="public-eyebrow">Nivel 1 · Pensamiento computacional</p>
        <span className="pill">Ejemplo respondido</span>
        <h2>¿Qué acción representa mejor la descomposición?</h2>
        <ul className="example-options">
          <li>Resolver todo de una vez</li><li className="example-correct"><b>Respuesta correcta:</b> Separar un problema grande en subtareas manejables</li><li>Eliminar requisitos</li><li>Copiar una solución</li>
        </ul>
        <p className="example-feedback"><b>Correcto.</b> Descomponer permite tratar cada parte de forma independiente y verificable.</p>
      </aside>
    </section>
    <section className="public-stats" aria-label="Contenido de la ruta">
      {[["15", "niveles en una sola ruta"], ["92", "lecciones con dos ejercicios"], ["15", "exámenes, uno por nivel"], ["2", "proyectos finales"]].map(([n, label]) => <div key={label}><strong>{n}</strong><span>{label}</span></div>)}
    </section>
    <section id="como-funciona" className="public-section">
      <h2>Así se avanza en CodeZero</h2><p className="muted">Siempre sabes qué sigue. Cada nivel repite los mismos cuatro pasos.</p>
      <div className="public-steps">
        {[["Lee la lección", "Texto claro, un ejemplo guiado y una lista para comprobar que entendiste."], ["Practica", "Dos ejercicios por lección. Al responder ves la explicación, aciertes o no."], ["Presenta el examen", "Cinco preguntas al cierre del nivel. Con 70 % o más pasas al siguiente."], ["Construye un proyecto", "En los niveles 10 y 15 entregas un proyecto final y recibes retroalimentación."]].map(([title, text], i) => <article className="card" key={title}><span className="public-step-number">{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>
    <section id="ruta" className="public-section">
      <h2>La ruta completa</h2><p className="muted">Dos etapas. Primero aprendes a programar; después te especializas en integraciones para SaaS.</p>
      <div className="public-route-grid">
        <article className="card"><p className="public-eyebrow">Niveles 1 a 10</p><h3>Etapa 1 · Fundamentos</h3><ol>{foundation.map(title => <li key={title}>{title}</li>)}</ol></article>
        <article className="public-dark"><p className="public-eyebrow">Niveles 11 a 15</p><h3>Etapa 2 · Integraciones</h3><ol start={11}>{integrations.map(title => <li key={title}>{title}</li>)}</ol></article>
      </div>
    </section>
    <section className="public-section">
      <h2>¿Para quién es?</h2><div className="public-audience">
        {[["Empiezas de cero", "Nunca has programado. El Nivel 1 enseña a pensar el problema antes de escribir una sola línea."], ["Trabajas en SaaS", "Customer Success, Onboarding o soporte, y quieres entender la parte técnica de tu producto."], ["Buscas especializarte", "Apuntas a Integraciones o Solutions Engineering: APIs, OAuth, webhooks y sistemas empresariales."]].map(([title, text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div><p className="notice">¿Tienes menos de 18 años? Puedes registrarte con la autorización de tu madre, padre o tutor.</p>
    </section>
    <section id="preguntas" className="public-section public-faq">
      <h2>Preguntas frecuentes</h2>
      <details open><summary>¿Necesito saber programar?</summary><p>No. La ruta empieza con pensamiento computacional y el primer lenguaje, Python, llega hasta el Nivel 2.</p></details>
      <details><summary>¿Cuánto cuesta?</summary><p>El Nivel 1 es gratis. Consulta los precios y los límites vigentes en <Link href="/pricing">Precios</Link>.</p></details>
      <details><summary>¿Puedo cancelar cuando quiera?</summary><p>Sí. Conservas tu plan hasta el final del periodo pagado. Los detalles están en <Link href="/refunds">Cancelaciones y reembolsos</Link>.</p></details>
      <details><summary>¿Dónde puedo pedir ayuda?</summary><p>Visita el <Link href="/help">Centro de ayuda</Link> o consulta nuestras opciones de <Link href="/contact">Contacto</Link>.</p></details>
    </section>
    <section className="public-close"><h2>Empieza hoy con el Nivel 1, sin costo.</h2><Link className="btn accent" href="/login?modo=registro">Empezar gratis</Link></section>
  </main></LocalizedContent>;
}

