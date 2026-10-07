import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { publicMetadata } from "../../../lib/public-metadata";

export async function generateMetadata() { return translatedMetadata(publicMetadata("Cancelaciones y reembolsos", "Consulta las condiciones de cancelación, reembolsos y contacto de facturación de CodeZero.", "/refunds")); }

export default function RefundsPage() {
  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div><span className="pill">FACTURACIÓN</span><h1>Cancelaciones y reembolsos</h1></div>
        <Link className="btn secondary" href="/pricing">Planes</Link>
      </div>
      <article className="card" style={{lineHeight:1.75}}>
        <p>Última actualización: 7 de octubre de 2026.</p>

        <p>
          Esta política aplica a CodeZero, operado por <b>Isaac López García</b>
          (<b>Isaac Garciloga</b>), persona física con operación en Ciudad de México, México.
        </p>

        <h2>Cancelación</h2>
        <p>
          Las suscripciones se renuevan automáticamente cada mes hasta que se cancelen.
          Puedes cancelar desde Perfil → Administrar suscripción. Cuando la cancelación se programa
          al final del periodo, conservas el acceso pagado hasta que termine el ciclo vigente y
          después tu cuenta vuelve al plan Free.
        </p>

        <h2>Reembolsos</h2>
        <p>
          Salvo que la legislación aplicable exija otra cosa, los periodos ya iniciados no se
          reembolsan automáticamente. Si detectas un cobro duplicado, un error técnico o un cargo
          no reconocido, se revisará caso por caso.
        </p>

        <h2>Pagos fallidos</h2>
        <p>
          Stripe puede reintentar cobros fallidos. Durante ese proceso, CodeZero puede mostrar
          el estado de facturación correspondiente y solicitar la actualización del método de pago.
        </p>

        <h2>Exámenes y certificados</h2>
        <p>No existe una compra separada de exámenes ni certificados. Sus condiciones dependen del contenido y cuotas del plan. La cancelación de la suscripción no elimina certificados ya emitidos. Un resultado no aprobado no genera por sí solo un cargo adicional.</p>
        <h2>Contacto de facturación</h2>
        <p>
          Para dudas sobre cobros o cancelaciones escribe a
          {" "}<a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a>
          {" "}o llama al <a href="tel:+525533881002">+52 55 3388 1002</a>.
        </p>

        <p className="muted">
          Política operativa provisional. Debe revisarse con asesoría legal y fiscal antes de un
          lanzamiento comercial general.
        </p>
      </article>
    </main></LocalizedContent>
  );
}


