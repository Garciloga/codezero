import Link from "next/link";

const plans = [
  { name: "Free", price: "$0", note: "Para empezar", features: ["Nivel 1 y ruta guiada", "20 ejercicios / mes", "1 examen / mes", "1 proyecto"], href: "/login" },
  { name: "Starter", price: "$249 MXN", note: "Para avanzar con estructura", features: ["Ruta completa", "200 ejercicios / mes", "10 evaluaciones / mes", "20 consultas IA / mes", "5 proyectos"], href: "/checkout?plan=starter" },
  { name: "Pro", price: "$699 MXN", note: "Para formación intensiva", features: ["Ruta completa", "1,000 ejercicios / mes", "50 evaluaciones / mes", "100 consultas IA / mes", "20 proyectos", "Ruta SaaS e Integraciones"], href: "/checkout?plan=pro" },
  { name: "Enterprise", price: "Desde $1,299 MXN", note: "Para equipos y empresas", features: ["Usuarios y equipos", "Límites personalizados", "Administración central", "Preparado para SSO", "Soporte empresarial"], href: "/checkout?plan=enterprise" },
];

export default function Pricing() {
  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">CODEZERO</span>
          <h1>Planes</h1>
          <p className="muted">Elige el plan que mejor se adapta a tu ritmo de aprendizaje.</p>
        </div>
        <Link className="btn secondary" href="/">Inicio</Link>
      </div>

      <div className="grid grid4">
        {plans.map((plan) => (
          <div className="card" key={plan.name}>
            <h2>{plan.name}</h2>
            <div className="stat">{plan.price}</div>
            <p className="muted">{plan.note}</p>
            <ul>
              {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <Link className="btn" href={plan.href}>
              {plan.name === "Enterprise" ? "Elegir Enterprise" : plan.name === "Free" ? "Empezar" : "Elegir plan"}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
