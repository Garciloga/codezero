import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { publicMetadata } from "../../../lib/public-metadata";

export async function generateMetadata() { return translatedMetadata(publicMetadata("Aviso de privacidad", "Consulta cómo CodeZero trata los datos de cuenta y aprendizaje.", "/privacy")); }

export default function PrivacyPage() {
  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div><span className="pill">PRIVACIDAD</span><h1>Aviso de privacidad</h1></div>
        <Link className="btn secondary" href="/">Inicio</Link>
      </div>
      <article className="card" style={{lineHeight:1.75}}>
        <p>Última actualización: 7 de octubre de 2026.</p>

        <h2>Responsable</h2>
        <p>
          El responsable del tratamiento de datos de CodeZero es <b>Isaac López García</b>,
          también identificado públicamente como <b>Isaac Garciloga</b>, persona física con
          operación en Ciudad de México, México.
        </p>
        <p>
          Correo de contacto y privacidad: <a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a><br />
          Teléfono: <a href="tel:+525533881002">+52 55 3388 1002</a>
        </p>

        <h2>Personas menores de edad</h2>
        <p>
          CodeZero está diseñado también para estudiantes menores de 18 años. Cuando una persona
          menor utilice la plataforma, se espera la autorización y supervisión de su madre, padre o
          tutor legal cuando corresponda. Procuramos limitar el tratamiento a los datos necesarios
          para prestar el servicio educativo y operar la cuenta.
        </p>
        <p>
          Si un adulto responsable considera que una persona menor proporcionó información sin la
          autorización correspondiente, puede solicitar su revisión o eliminación mediante el correo
          de privacidad publicado en esta página.
        </p>

        <h2>Datos que podemos tratar</h2>
        <p>
          Información de cuenta como nombre y correo, progreso académico, respuestas e intentos,
          proyectos enviados, datos de plan y referencias de facturación. Los datos completos de
          tarjeta son procesados por Stripe y no se almacenan directamente en CodeZero.
        </p>

        <p>Idioma preferido y edad opcional de registro. La elección de idioma solo personaliza la presentación; no cambia permisos, calificaciones ni precios.</p>
        <h2>Finalidades</h2>
        <p>
          Autenticación, prestación del servicio, seguimiento del progreso, soporte, prevención
          de abuso, operación de pagos, seguridad y mejora del producto.
        </p>

        <h2>Proveedores</h2>
        <p>
          CodeZero utiliza proveedores tecnológicos para operar la plataforma. Entre ellos se
          encuentran Vercel para hosting y despliegue, Supabase para base de datos y autenticación,
          y Stripe para procesamiento y administración de pagos. Resend podrá utilizarse para correo
          transaccional cuando el servicio de dominio y SMTP quede habilitado. El proveedor de IA
          solo tratará consultas cuando el Tutor IA sea habilitado. Estos proveedores procesan
          información conforme a la función técnica que prestan y a sus propias obligaciones de
          seguridad y privacidad.
        </p>

        <h2>Transferencias y procesamiento técnico</h2>
        <p>
          Algunos proveedores pueden procesar información en infraestructura ubicada fuera de
          México. CodeZero procura limitar los datos compartidos a lo necesario para prestar cada
          servicio y mantener controles de acceso adecuados.
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
          Puedes descargar desde tu perfil una copia de los datos de cuenta y aprendizaje asociados
          a tu usuario. También puedes solicitar acceso, rectificación, corrección, eliminación u
          oposición al tratamiento de tus datos cuando corresponda conforme a la legislación
          aplicable. Para estas solicitudes puedes escribir a
          {" "}<a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a>.
        </p>

        <h2>Solicitudes ARCO y revocación del consentimiento</h2>
        <p>Escribe al correo de privacidad con tu nombre, un medio de respuesta, el derecho que deseas ejercer y una descripción de los datos o cuenta. Verificaremos tu identidad o representación por un medio adecuado; no envíes contraseñas ni datos de tarjeta. Para rectificación indica el cambio solicitado y su respaldo.</p>
        <p>Comunicaremos la determinación dentro de veinte días hábiles desde la recepción de la solicitud y, cuando proceda, la haremos efectiva dentro de los quince días hábiles siguientes, conforme a la ley y sus excepciones o ampliaciones aplicables. La solicitud de acceso es gratuita, salvo costos legalmente permitidos de reproducción o envío.</p>
        <h2>Certificados públicos y organizaciones</h2>
        <p>El enlace público de un certificado muestra nombre, título y fecha de emisión solo después de tu consentimiento. Retirarlo deshabilita el enlace; no elimina el documento privado. Las actividades de Customer Success y proyectos se guardan de forma privada y los revisores autorizados pueden consultar lo necesario para evaluar la entrega. En equipos, los responsables autorizados consultan el avance correspondiente a su organización y jerarquía.</p>
        <p>Las listas de espera registran interés, no consentimiento para campañas comerciales. Puedes retirar tu interés. Los ejercicios solicitan datos ficticios; no introduzcas datos sensibles ni información confidencial de tu empresa.</p>
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
    </main></LocalizedContent>
  );
}


