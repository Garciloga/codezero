import Link from "next/link";
export default function Checkout(){
 return <main className="wrap"><div className="card" style={{maxWidth:650,margin:"60px auto"}}>
  <span className="pill">PAGO SEGURO</span><h1>Suscripción CodeZero</h1>
  <p className="muted">El checkout real se conecta a Stripe mediante una sesión creada en servidor. No introduzcas aquí claves secretas.</p>
  <p>Selecciona el plan desde la página de precios después de configurar los Price IDs de Stripe.</p>
  <Link className="btn secondary" href="/pricing">Volver a planes</Link>
 </div></main>
}
