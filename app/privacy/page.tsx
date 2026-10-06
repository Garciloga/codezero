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

        <h2>Responsable</h2>
        <p>
          El responsable del tratamiento de datos de CodeZero es <b>Isaac López Garcia</b>,
          también identificado públicamente como <b>Isaac Garciloga</b>, persona física con
          operación en Ciudad de México, México.
        </p>
        <p>
          Correo de contacto y privacidad: <a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a><br />
          Teléfono: <a href="tel:+525533881002">+52 55 3388 1002</a>
        </p>

        <h2>Datos que podemos tratar</h2>
        <p>
          Información de cuenta como nombre y correo, progreso académico, respuestas e intentos,
          proyectos enviados, datos de plan y referencias de facturación. Los datos completos de
          tarjeta son procesados por Stripe y no se almacenan directamente en CodeZero.
        </p>

        <h2>Finalidades</h2>
        <p>
          Autenticación, prestación del servicio, seguimiento del progreso, soporte, prevención
          de abuso, operación de pagos, seguridad y mejora del producto.
        </p>

        <h2>Proveedores</h2>
        <p>
          CodeZero utiliza proveedores tecnológicos para hosting, base de datos, autenticación,
          procesamiento de pagos y otros servicios necesarios para operar la plataforma.
          Estos proveedores pueden procesar información únicamente para prestar sus servicios
          conforme a sus propias obligaciones y medidas de seguridad.
        </p>

        <h2>Conservación y seguridad</h2>
        <p>
          Conservamos los datos durante el tiempo necesario para operar la cuenta, cumplir
          obligaciones aplicables y proteger la integridad del servicio. Aplicamos controles
          técnicos como autenticación, permisos, restricciones de acceso y separación entre
          operaciones públicas y administrativas.
        </p>

        <h2>Derechos de las personas usuarias</h2>
        <p>
          Puedes solicitar acceso, rectificación, corrección, eliminación u oposición al tratamiento
          de tus datos cuando corresponda conforme a la legislación aplicable. Para ejercer estos
          derechos puedes escribir a <a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a>.
        </p>

        <h2>Cambios al aviso</h2>
        <p>
          Cualquier cambio material a este aviso se publicará en esta misma página con la fecha
          correspondiente.
        </p>

        <p className="muted">
          Este aviso es una base operativa y debe revisarse jurídicamente antes de una
          comercialización amplia.
        </p>
      </article>
    </main>
  );
}
