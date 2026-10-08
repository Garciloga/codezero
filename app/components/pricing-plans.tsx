import { localeContext } from "../../lib/localization/server";
import { LANGUAGE_TAGS } from "../../lib/localization/shared";
import LocalizedContent from "./localization/server";
import Link from "next/link";
import { planLimit, planPrice } from "../../lib/public-plans";
import type { PublicPlan } from "../../lib/public-plans";

const labels = { free: "Free", starter: "Starter", pro: "Pro" };
const notes = { free: "Para probar si esto es para ti", starter: "Para avanzar con estructura", pro: "Para formación intensiva" };

export default async function PricingPlans({ plans, currentPlan }: { plans: PublicPlan[]; currentPlan: string | null }) {
  const { locale } = await localeContext();
  return <LocalizedContent><>
    <div className="public-plans">
      {plans.map(plan => <article className={"card public-plan " + (plan.name === "starter" ? "featured" : "")} key={plan.name}>
        {plan.name === "starter" && <span className="pill recommended">Recomendado</span>}
        <h2>{labels[plan.name]}</h2><p className="muted">{notes[plan.name]}</p>
        <p className="public-price"><strong>{planPrice(plan.price_monthly_cents, LANGUAGE_TAGS[locale])}</strong><span>MXN al mes</span></p>
        {currentPlan === plan.name && plan.name !== "free" ? <button className="btn" disabled>Tu plan actual</button> :
          <Link prefetch={false} className={"btn " + (plan.name === "starter" ? "" : "secondary")} href={plan.name === "free" ? "/login?modo=registro" : "/checkout?plan=" + plan.name}>
            {plan.name === "free" ? "Empezar gratis" : "Elegir " + labels[plan.name]}
          </Link>}
        <ul>
          <li>{plan.name === "free" ? "Nivel 1 completo" : "Ruta completa: niveles 1 a 15"}</li>
          <li>{planLimit(plan.exercise_limit, LANGUAGE_TAGS[locale])} ejercicios al mes</li>
          <li>{planLimit(plan.exam_limit, LANGUAGE_TAGS[locale])} exámenes incluidos al mes, sin cobro por intento</li>
          <li>{plan.project_limit === 0 ? "Sin entregas de proyectos" : planLimit(plan.project_limit, LANGUAGE_TAGS[locale]) + " entregas de proyectos al mes"}</li>
          {plan.name === "pro" && <li>Customer Success: ocho unidades, examen y proyecto final; kit de empleabilidad incluido</li>}
          <li>{plan.name === "free" ? "Examen del Nivel 1 incluido; el programa completo requiere un plan de pago" : "Diplomas y certificado del programa incluidos al aprobar, sin pago adicional"}</li>
        </ul>
      </article>)}
    </div>
    <section className="public-section"><h2>Compara los planes</h2>
      <p>Actualmente hay dos proyectos finales. Tu plan limita las entregas que puedes enviar cada mes.</p>
      <div className="public-comparison" tabIndex={0} role="region" aria-label="Comparación de planes con desplazamiento horizontal">
        <table><caption>Contenido y límites mensuales</caption><thead><tr><th scope="col">Qué incluye</th>{plans.map(p => <th scope="col" key={p.name}>{labels[p.name]}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Niveles disponibles</th>{plans.map(p => <td key={p.name}>{p.name === "free" ? "Nivel 1" : "Ruta completa e Integraciones"}</td>)}</tr>
            <tr><th scope="row">Ejercicios al mes</th>{plans.map(p => <td key={p.name}>{planLimit(p.exercise_limit, LANGUAGE_TAGS[locale])}</td>)}</tr>
            <tr><th scope="row">Exámenes al mes</th>{plans.map(p => <td key={p.name}>{planLimit(p.exam_limit, LANGUAGE_TAGS[locale])}</td>)}</tr>
            <tr><th scope="row">Entregas de proyectos al mes</th>{plans.map(p => <td key={p.name}>{planLimit(p.project_limit, LANGUAGE_TAGS[locale])}</td>)}</tr>
            <tr><th scope="row">Cobro adicional por exámenes</th>{plans.map(p => <td key={p.name}>Ninguno dentro de la cuota</td>)}</tr>
            <tr><th scope="row">Diplomas y certificado</th>{plans.map(p => <td key={p.name}>{p.name === "free" ? "Según el contenido disponible; no incluye completar el programa" : "Incluidos al aprobar"}</td>)}</tr>
            <tr><th scope="row">Precio mensual en MXN</th>{plans.map(p => <td key={p.name}>{planPrice(p.price_monthly_cents, LANGUAGE_TAGS[locale])}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </section>
  </></LocalizedContent>;
}



