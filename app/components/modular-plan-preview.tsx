"use client";
import LocalizedContent from "./localization/client";

import { useState } from "react";
import { ADDON_OFFERS, BASE_PRICES, FUTURE_ROUTES, quoteModularPlan, type BasePlan } from "../../lib/modular-offers";
import { planPrice } from "../../lib/public-plans";

import AddonWaitlistButton from "./addon-waitlist-button";

// Commercial simulation only, never used for product readiness or checkout.
const simulatedReady = { tutor: true, customerSuccess: true, certificate: true };
export default function ModularPlanPreview({waitlist = [], waitlistEnabled = false}: {waitlist?: string[]; waitlistEnabled?: boolean}) {
  const [plan, setPlan] = useState<BasePlan>("starter");
  const [tutor, setTutor] = useState(false);
  const [route, setRoute] = useState(false);
  const keys = [tutor && plan !== "free" ? "ai_tutor" : "", route && plan !== "free" ? "route_customer_success" : ""].filter(Boolean);
  const quote = quoteModularPlan(plan, keys, simulatedReady);
  return <LocalizedContent><>
    <section className="card modular-preview" aria-labelledby="modular-choice-title">
      <h2 id="modular-choice-title">Un plan sencillo. Tu propio camino.</h2>
      <fieldset><legend>1. Elige tu base</legend><div className="modular-plan-options">
        {(["free", "starter", "pro"] as const).map(key => <label key={key} className={plan === key ? "modular-selected" : ""}>
          <input type="radio" name="base-plan" value={key} checked={plan === key} onChange={() => setPlan(key)} />
          <strong>{key === "free" ? "Free" : key === "starter" ? "Starter" : "Pro"}</strong>
          <span>{planPrice(BASE_PRICES[key])}/mes</span>
        </label>)}
      </div></fieldset>
      <fieldset><legend>2. Personaliza tu aprendizaje</legend>
        <p>{plan === "pro" ? "Tutor, una ruta elegida y certificados están incluidos cuando estén habilitados. Simulador incluido cuando esté disponible." : plan === "free" ? "Los módulos mensuales requieren Starter o Pro. Los pagos únicos se conservan al volver a Free." : "Los módulos mensuales se suman a la misma factura y comienzan en la siguiente renovación."}</p>
        <div className="modular-checks">
          <label><input type="checkbox" checked={plan === "pro" || (plan !== "free" && tutor)} disabled={plan !== "starter"} onChange={event => setTutor(event.target.checked)} /> Tutor IA · {plan === "pro" ? "Incluido" : "$50 el primer mes; después $100/mes"}</label>
          <label><input type="checkbox" checked={plan === "pro" || (plan !== "free" && route)} disabled={plan !== "starter"} onChange={event => setRoute(event.target.checked)} /> Ruta Customer Success · {plan === "pro" ? "Una ruta incluida" : "$149/mes"}</label>
          <p>Exámenes incluidos dentro de la cuota del plan. Diplomas y certificados sin cargo adicional al aprobar el contenido al que tengas acceso.</p>
        </div>
        <p className="muted">El certificado requiere completar y aprobar la ruta. Esta simulación no habilita módulos ni realiza compras.</p>
      </fieldset>
      <div className="modular-quote" role="status" aria-live="polite" aria-atomic="true">
        <h3>Así quedaría tu cobro</h3>
        <dl><div><dt>Primer mes del módulo</dt><dd>{planPrice(quote.firstMonthCents)}</dd></div>
        <div><dt>Mensualidad desde el segundo mes</dt><dd>{planPrice(quote.renewalCents)}</dd></div>
        <div><dt>Compras únicas, por separado</dt><dd>{planPrice(quote.oneTimeCents)}</dd></div></dl>
        <p>MXN. IVA incluido pendiente de confirmación fiscal. Sin cargos inmediatos ni prorrateos en esta propuesta.</p>
      </div>
    </section>
    <section className="public-section" aria-labelledby="future-routes-title"><h2 id="future-routes-title">¿Hacia dónde quieres crecer?</h2>
      <p>Estas rutas están en exploración. El interés en la lista de espera ayudará a decidir cuál desarrollar primero.</p>
      <div className="modular-catalog">{FUTURE_ROUTES.map(route => <article className="card" key={route.key}>
        <span className="pill">Próximamente</span><h3>{route.label}</h3><p>{route.detail}</p>
        <p className="muted">{route.stage}</p><AddonWaitlistButton addonKey={route.key} enabled={waitlistEnabled} initial={waitlist.includes(route.key)} /><p><strong>$149/mes</strong> cuando esté disponible.</p>
      </article>)}</div>
      <p className="muted">Todavía no se pueden comprar ni cursar. El guardado de interés está disponible solo en el sandbox configurado.</p>
    </section>
    <section className="public-section" aria-labelledby="modular-coming-title"><h2 id="modular-coming-title">Más opciones para crecer</h2>
      <div className="modular-catalog">{ADDON_OFFERS.filter(offer => !("readiness" in offer) && !FUTURE_ROUTES.some(route => route.key === offer.key)).map(offer => <article className="card" key={offer.key}>
        <span className="pill">Próximamente</span><h3>{offer.label}</h3><p>{offer.detail}</p>
        <p><strong>{planPrice(offer.cents)}</strong> {offer.kind === "monthly" ? "/mes" : "pago único"}</p>
        <AddonWaitlistButton addonKey={offer.key} enabled={waitlistEnabled} initial={waitlist.includes(offer.key)} />
      </article>)}</div>
      <p className="muted">La lista de espera registra interés privado en pruebas. Estas opciones no tienen checkout.</p>
    </section>
  </></LocalizedContent>;
}


