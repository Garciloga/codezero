import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="wrap">
      <div className="nav">
        <div><span className="pill">PRIVACIDAD</span><h1>Aviso de privacidad</h1></div>
        <Link className="btn secondary" href="/">Inicio</Link>
      </div>
      <article className="card" style={{lineHeight:1.75}}>
        <p>Última actualización: 6 de octubre de 2026.</p>
        <p>CodeZero trata datos necesarios para crear cuentas, prestar el servicio, guardar progreso, gestionar suscripciones, proteger la plataforma y mejorar la experiencia educativa.</p>
        <h2>Datos que podemos tratar</h2>
        <p>Información de cuenta como nombre y correo, progreso académico, respuestas e intentos, proyectos enviados, datos de plan y referencias de facturación. Los datos completos de tarjeta son procesados por Stripe y no se almacenan directamente en CodeZero.</p>
        <h2>Finalidades</h2>
        <p>Autenticación, prestación del servicio, seguimiento del progreso, soporte, prevención de abuso, operación de pagos y mejora del producto.</p>
        <h2>Proveedores</h2>
        <p>CodeZero utiliza proveedores tecnológicos para hosting, base de datos, autenticación y pagos. Estos proveedores pueden procesar información únicamente para prestar sus servicios conforme a sus propios términos y medidas de seguridad.</p>
        <h2>Conservación y seguridad</h2>
        <p>Conservamos los datos durante el tiempo necesario para operar la cuenta, cumplir obligaciones aplicables y proteger la integridad del servicio. Aplicamos controles técnicos como autenticación, permisos y restricciones de acceso.</p>
        <h2>Derechos</h2>
        <p>Puedes solicitar acceso, corrección o eliminación de información conforme a la legislación aplicable. Los medios formales de contacto del responsable deberán publicarse antes del lanzamiento comercial general.</p>
        <p className="muted">Este aviso es una base operativa y debe adaptarse a la identidad legal del responsable y a la normativa aplicable antes de una comercialización amplia.</p>
      </article>
    </main>
  );
}
