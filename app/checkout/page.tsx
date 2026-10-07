"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const labels: Record<string, string> = {
  starter: "Starter · $249 MXN/mes",
  pro: "Pro · $699 MXN/mes",
  enterprise: "Enterprise · $1,299 MXN/mes",
};

export default function CheckoutPage() {
  const [plan, setPlan] = useState("starter");

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("plan");
    if (selected && labels[selected]) setPlan(selected);
  }, []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentAuthorization, setPaymentAuthorization] = useState(false);

  async function startCheckout() {
    if (!paymentAuthorization) {
      setError("Confirma que eres mayor de 18 años o que cuentas con autorización del adulto responsable y del titular del método de pago.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, paymentAuthorization: true }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        if (data.error === "STRIPE_NOT_CONFIGURED") {
          setError("Los pagos todavía no están activados.");
        } else if (data.error === "UNAUTHENTICATED") {
          setError("Inicia sesión antes de contratar un plan.");
        } else {
          setError("No fue posible iniciar el pago.");
        }
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("No fue posible conectar con el sistema de pagos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">CHECKOUT</span>
          <h1>Contratar CodeZero</h1>
          <p className="muted">Revisa tu selección antes de continuar al pago seguro.</p>
        </div>
        <Link className="btn secondary" href="/pricing">Volver a planes</Link>
      </div>

      <div className="card" style={{ maxWidth: 620 }}>
        <div className="muted">Plan seleccionado</div>
        <div className="stat">{labels[plan] ?? labels.starter}</div>

        <p className="muted">
          La suscripción se gestionará mediante Stripe.
        </p>

        <label style={{display:"flex",gap:10,alignItems:"flex-start",margin:"18px 0",fontSize:14}}>
          <input
            type="checkbox"
            checked={paymentAuthorization}
            onChange={(e) => setPaymentAuthorization(e.target.checked)}
            style={{marginTop:3}}
          />
          <span>
            Confirmo que soy mayor de 18 años o que cuento con autorización del adulto responsable,
            y que tengo autorización para usar el método de pago.
          </span>
        </label>

        <p className="muted" style={{fontSize:13}}>
          Al continuar aceptas los <Link href="/terms">Términos</Link> y la política de
          {" "}<Link href="/refunds">cancelaciones y reembolsos</Link>.
        </p>

        {error && <p role="alert">{error}</p>}

        <button className="btn" onClick={startCheckout} disabled={loading}>
          {loading ? "Preparando pago..." : "Continuar al pago"}
        </button>
      </div>
    </main>
  );
}
