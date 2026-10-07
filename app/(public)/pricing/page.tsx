import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { publicMetadata } from "../../../lib/public-metadata";
import { getPublicPlans } from "../../../lib/public-plans-server";
import { createServerSupabase } from "../../../lib/supabase-server";
import PricingPlans from "../../components/pricing-plans";

export async function generateMetadata() { return translatedMetadata(publicMetadata("Precios", "Compara los planes de CodeZero, sus precios en pesos mexicanos y sus límites mensuales.", "/pricing")); }
type PageProps = { searchParams: Promise<{ checkout?: string }> };

async function getCurrentPlan() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("plan_name,status").eq("id", user.id).single();
  return !error && data?.status === "active" ? data.plan_name as string : null;
}
export default async function Pricing({ searchParams }: PageProps) {
  const [{ checkout }, plans, currentPlan] = await Promise.all([searchParams, getPublicPlans(), getCurrentPlan()]);
  return <LocalizedContent><main className="wrap public-pricing">
    <section className="public-pricing-intro"><h1>Empieza gratis. Paga cuando quieras avanzar.</h1><p className="muted">Precios en pesos mexicanos, por mes. Puedes cambiar o cancelar tu plan desde tu cuenta.</p></section>
    {checkout === "cancelled" && <div className="notice" role="status"><b>Pago cancelado.</b><p>No se realizó ningún cargo. Puedes elegir un plan cuando quieras.</p></div>}
    {plans ? <PricingPlans plans={plans} currentPlan={currentPlan} /> : <section className="notice">
      <p role="alert">No pudimos cargar los planes. Intenta de nuevo o contacta a soporte.</p>
      <div className="public-actions"><a className="btn" href="/pricing">Reintentar</a><Link className="btn secondary" href="/contact">Contacto</Link></div>
    </section>}
    <section className="public-dark public-enterprise"><h2>Para equipos y empresas</h2><Link className="btn accent" href="/contact">Hablar con nosotros</Link></section>
    <section className="public-section public-faq"><h2>Sobre los pagos</h2>
      <details open><summary>¿Qué pasa si cancelo?</summary><p>Conservas tu plan hasta el final del periodo que ya pagaste. Después tu cuenta pasa a Free y tu avance se queda guardado.</p></details>
      <details><summary>¿Hay reembolsos?</summary><p>Consulta las condiciones y los casos que se revisan en <Link href="/refunds">Cancelaciones y reembolsos</Link>.</p></details>
      <details><summary>¿Dónde puedo revisar un cobro?</summary><p>Consulta el contacto de facturación en <Link href="/refunds">Cancelaciones y reembolsos</Link>.</p></details>
    </section>
  </main></LocalizedContent>;
}

