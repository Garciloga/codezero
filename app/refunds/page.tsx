import Link from "next/link";

export default function RefundsPage() {
  return (
    <main className="wrap">
      <div className="nav">
        <div><span className="pill">FACTURACIÓN</span><h1>Cancelaciones y reembolsos</h1></div>
        <Link className="btn secondary" href="/pricing">Planes</Link>
      </div>
      <article className="card" style={{lineHeight:1.75}}>
        <p>Última actualización: 6 de octubre de 2026.</p>
        <p>Las suscripciones de CodeZero se renuevan automáticamente cada mes hasta que se cancelen.</p>
        <h2>Cancelación</h2>
        <p>Puedes cancelar desde Perfil → Administrar suscripción. Cuando la cancelación se programa al final del periodo, conservas el acceso pagado hasta que termine el ciclo vigente y después tu cuenta vuelve al plan Free.</p>
        <h2>Reembolsos</h2>
        <p>Salvo que la legislación aplicable exija otra cosa, los periodos ya iniciados no se reembolsan automáticamente. Si detectas un cobro duplicado, un error técnico o un cargo no reconocido, debe revisarse caso por caso.</p>
        <h2>Pagos fallidos</h2>
        <p>Stripe puede reintentar cobros fallidos. Durante ese proceso, CodeZero puede mostrar el estado de facturación correspondiente y solicitar la actualización del método de pago.</p>
        <p className="muted">Esta política debe revisarse con asesoría legal y fiscal antes del lanzamiento comercial general.</p>
      </article>
    </main>
  );
}
