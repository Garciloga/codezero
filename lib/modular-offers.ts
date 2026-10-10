import { TECHNICAL_ADDON_OFFERS } from "./technical-addon-offers.ts";
/** Approved v2 offers. No Stripe IDs or secrets; not an authorization source. */
export type BasePlan = "free" | "starter" | "pro";
export type Readiness = { tutor: boolean; customerSuccess: boolean; certificate: boolean };
export const BASE_PRICES = { free: 0, starter: 24900, pro: 69900 } as const;
/** Discovery only: no lessons, affinity recommendations or sellable entitlements. */
export const FUTURE_ROUTES = [
  { key: "route_operations", label: "Operaciones · RevOps, Sales Ops y CS Ops", stage: "Interés inicial", detail: "CRM, reportes y procesos comerciales con SQL e integraciones." },
  { key: "route_qa", label: "QA / Tester", stage: "Interés inicial", detail: "Calidad, pruebas y documentación de errores." },
  { key: "route_data_bi", label: "Analista de datos / BI", stage: "Interés inicial", detail: "Análisis y visualización de datos con SQL y Python." },
  { key: "route_product", label: "Producto · Product Owner / Product Manager", stage: "Etapa posterior", detail: "Priorización, descubrimiento y coordinación de producto." },
  { key: "route_management", label: "Liderazgo · Supervisión, Gerencia y Dirección", stage: "Etapa posterior", detail: "Delegación, seguimiento, coaching, decisiones y dirección de equipos." },
  { key: "route_solutions_integrations", label: "Solutions Engineer / Integraciones", stage: "Considerar después", detail: "Soluciones técnicas e integración de sistemas SaaS." },
  { key: "route_enablement", label: "Capacitación y Enablement", stage: "Considerar después", detail: "Customer Education, bases de conocimiento y documentación." },
  { key: "route_growth", label: "Marketing digital / Growth", stage: "Exploración futura", detail: "Adquisición, experimentación y crecimiento." },
] as const;
export const ROUTE_DISCOVERY_POLICY = {
  status: "coming_soon", initialHypothesis: "route_operations",
  buildBasedOn: "verified_waitlist_interest", excluded: ["ux_ui", "human_resources", "finance"],
} as const;
export const ADDON_OFFERS = [
  ...TECHNICAL_ADDON_OFFERS.map(o=>({key:o.key,label:o.label,kind:"monthly" as const,cents:o.priceCents,detail:o.detail,includedInPro:false})),
  { key: "ai_tutor", label: "Tutor IA", kind: "monthly", cents: 10000, introductoryCents: 5000, readiness: "tutor", includedInPro: true, detail: "100 consultas al mes" },
  { key: "route_customer_success", label: "Ruta de Customer Success", kind: "monthly", cents: 14900, readiness: "customerSuccess", includedInPro: true, detail: "La ruta elegida está incluida en Pro" },
  ...FUTURE_ROUTES.map(route => ({ ...route, kind: "monthly" as const, cents: 14900, includedInPro: true })),
  { key: "routes_three", label: "Tres rutas profesionales", kind: "monthly", cents: 34900, includedInPro: false, detail: "Paquete de tres rutas" },
  { key: "routes_all", label: "Todas las rutas", kind: "monthly", cents: 49900, includedInPro: false, detail: "Acceso al catálogo de rutas" },
  { key: "ai_simulator", label: "Simulador de situaciones", kind: "monthly", cents: 12900, includedInPro: true, detail: "20 sesiones al mes" },
  { key: "tool_labs", label: "Laboratorios de herramientas", kind: "monthly", cents: 9900, includedInPro: false, detail: "Práctica de herramientas" },
  { key: "verified_certificate", label: "Certificado verificable", kind: "one_time", cents: 0, readiness: "certificate", includedInPro: true, detail: "Incluido sin cargo adicional al completar y aprobar el contenido disponible en tu plan" },
  { key: "deep_diagnostic", label: "Diagnóstico profundo", kind: "one_time", cents: 19900, includedInPro: false, detail: "Diagnóstico de afinidad" },
  { key: "mentoring", label: "Mentoría 1:1", kind: "one_time", cents: 69900, includedInPro: false, detail: "45 minutos sobre puestos, procesos, decisiones y liderazgo" },
] as const;
export type AddonKey = typeof ADDON_OFFERS[number]["key"];
export const UNREADY: Readiness = { tutor: false, customerSuccess: false, certificate: false };

export function getOfferState(key: string, plan: BasePlan, ready: Readiness) {
  const offer = ADDON_OFFERS.find(item => item.key === key);
  if (!offer) return "unknown";
  if (!("readiness" in offer) || !ready[offer.readiness]) return "coming_soon";
  if (key === "verified_certificate") return "included";
  if (plan === "pro" && offer.includedInPro) return "included";
  if (plan === "free" && offer.kind === "monthly") return "paid_base_required";
  return "available";
}

/** Display quote only. Checkout must re-check server readiness, ownership and prices. */
export function quoteModularPlan(plan: BasePlan, keys: readonly string[], ready: Readiness) {
  if (!Object.hasOwn(BASE_PRICES, plan)) throw new Error("Plan inválido");
  let firstMonthCents: number = BASE_PRICES[plan];
  let renewalCents: number = firstMonthCents;
  let oneTimeCents = 0;
  const included: AddonKey[] = [];
  for (const key of new Set(keys)) {
    const state = getOfferState(key, plan, ready);
    if (state === "unknown" || state === "coming_soon" || state === "paid_base_required") {
      throw new Error(`Módulo no disponible: ${key}`);
    }
    const offer = ADDON_OFFERS.find(item => item.key === key)!;
    if (state === "included") { included.push(offer.key); continue; }
    if (offer.kind === "one_time") {
      if (offer.cents < 9900) throw new Error("Cargo único menor a 99 MXN");
      oneTimeCents += offer.cents;
    } else {
      firstMonthCents += "introductoryCents" in offer && typeof offer.introductoryCents === "number" ? offer.introductoryCents : offer.cents;
      renewalCents += offer.cents;
    }
  }
  if ((firstMonthCents > 0 && firstMonthCents < 9900) || (renewalCents > 0 && renewalCents < 9900)) {
    throw new Error("Factura mensual menor a 99 MXN");
  }
  return { firstMonthCents, renewalCents, oneTimeCents, included, startsAt: "next_renewal" as const };
}


