import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { publicMetadata } from "../../../lib/public-metadata";

export async function generateMetadata() { return translatedMetadata(publicMetadata("Aviso de privacidad", "Consulta cómo Garciloga trata los datos de cuenta y aprendizaje.", "/privacy")); }

export default function PrivacyPage() {
  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div><span className="pill">PRIVACIDAD</span><h1>Aviso de privacidad</h1></div>
        <Link prefetch={false} className="btn secondary" href="/">Inicio</Link>
      </div>
      <article className="card" style={{lineHeight:1.75}}>
        <p>Última actualización: 8 de octubre de 2026.</p>

        <h2>Responsable</h2>
        <p>
          El responsable del tratamiento de datos de Garciloga es <b>Isaac López García</b>,
          también identificado públicamente como <b>Isaac Garciloga</b>, persona física con
          operación en Ciudad de México, México.
        </p>
        <p>
          Correo de contacto y privacidad: <a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a><br />
          Teléfono: <a href="tel:+525533881002">+52 55 3388 1002</a>
        </p>

        <h2>Personas menores de edad</h2>
        <p>
          Garciloga está diseñado también para estudiantes menores de 18 años. Cuando una persona
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
          tarjeta son procesados por Stripe y no se almacenan directamente en Garciloga.
        </p>

        <p>Idioma preferido y edad opcional de registro. La elección de idioma solo personaliza la presentación; no cambia permisos, calificaciones ni precios.</p>
        <section className="card"><h2>Activación y portafolio voluntario</h2><p>Registramos cinco eventos mínimos: registro, primera lección completada, primera entrega, primera asignación y regreso después de una semana. Guardamos únicamente identificador de cuenta, evento y fecha por un máximo de 90 días para mejorar el aprendizaje. No registramos el contenido de tus entregas en estos eventos. Se incluyen en la exportación de tu cuenta.</p><p>El portafolio está apagado por defecto. Con tu consentimiento explícito, cualquier persona con el enlace puede ver tu nombre público y la selección de proyectos personales aprobados, competencias y certificados. No publica textos de entregas, datos de compañías, datos de otras personas ni tu foto privada. Puedes retirarlo en cualquier momento; los enlaces anteriores dejan de funcionar. Una persona que lo haya visto puede conservar una copia fuera de Garciloga.</p></section><h2>Fotos, soporte y colaboración</h2><p>Tu foto de perfil se guarda en almacenamiento privado, puedes cambiarla o eliminarla desde Mi cuenta. La marca de compañía solo es visible a sus miembros autorizados.</p><p>El propietario puede abrir una vista de alumno de solo lectura durante un máximo de 20 minutos para revisar progreso y errores. La sesión se registra, caduca y bloquea escrituras; no entrega tu contraseña.</p><p>La comunidad usa un alias voluntario y publicaciones moderadas. Puedes retirar tus publicaciones; los moderadores revisan reportes. Las solicitudes de mentoría guardan tema, horario y estado visibles a ti y al propietario.</p><p>Los mensajes de compañía se limitan a la organización o equipo autorizado y se conservan hasta 90 días. La práctica ejecutable utiliza código y datos ficticios en ejecución aislada; la evidencia guardada pertenece a tu aprendizaje.</p><p>Los planes de desarrollo conservan objetivos, fecha, actividades, aceptación y comentarios dentro del mismo alcance del equipo. No modifican calificaciones ni se vinculan a compensación.</p><p>Los avisos se derivan de eventos existentes; guardamos preferencias y marcas de lectura, estas últimas por un máximo de 90 días. Puedes silenciar cada tipo y exportar tus datos desde Mi cuenta.</p><h2>Uso dentro de la plataforma</h2><p>Para ofrecer acompañamiento registramos por cuenta, día y sección los conteos de clics en controles y visitas, y la última actividad. Solo el propietario consulta el ranking de cuentas activas; las vistas de soporte como alumno y el uso del propietario quedan excluidos. No capturamos textos escritos, contraseñas, contenido de mensajes ni direcciones completas en esta medición. No mide aprendizaje ni desempeño. Se conserva hasta 90 días y está incluida en la exportación de tu cuenta. Puedes solicitar revisión u oposición mediante el contacto de privacidad.</p><h2>Finalidades</h2>
        <p>
          Autenticación, prestación del servicio, seguimiento del progreso, soporte, prevención
          de abuso, operación de pagos, seguridad y mejora del producto.
        </p>

        <h2>Marco de seguridad y privacidad</h2>
        <p>Trabajamos en la adopción progresiva de controles tomando como referencia ISO/IEC 27001:2022 para la gestión de seguridad de la información, ISO/IEC 27002:2022 para controles de seguridad e ISO/IEC 27701:2025 para la gestión de privacidad. Esto describe nuestro marco de trabajo; Garciloga no anuncia una certificación ISO ni una auditoría independiente completada.</p>
        <p>Consideramos los principios y obligaciones del Reglamento General de Protección de Datos de la Unión Europea (GDPR/RGPD), cuando resulte aplicable por su ámbito territorial y el tratamiento realizado: finalidad y base jurídica, minimización, transparencia, conservación limitada, seguridad y atención de derechos. La aplicabilidad, los acuerdos con encargados y las salvaguardas de transferencias internacionales requieren revisión específica; no presentamos esta declaración como garantía de cumplimiento integral.</p>
        <p>Aplicamos sesiones verificadas, permisos en servidor y restricciones por organización y jerarquía para el avance de equipos. Un supervisor consulta a sus reportes directos; un gerente, a su rama; Dueño y Administrador, a la organización. El organigrama puede mostrar nombre, puesto y relaciones de otros miembros, sin sus resultados de aprendizaje.</p>
        <p>Puedes solicitar revisión del tratamiento o ejercer los derechos aplicables mediante el contacto de privacidad. Revisaremos la identidad y la solicitud, sin pedir tu contraseña. Los controles, incidencias y medidas de recuperación deben revisarse de forma continua.</p>
        <p>Referencias: <a href="https://www.iso.org/standard/27001">ISO/IEC 27001</a>, <a href="https://www.iso.org/standard/75652.html">ISO/IEC 27002</a>, <a href="https://www.iso.org/standard/27701">ISO/IEC 27701</a> y <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng">GDPR/RGPD</a>.</p>
        <h2>Proveedores</h2>
        <p>
          Garciloga utiliza proveedores tecnológicos para operar la plataforma. Entre ellos se
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
          México. Garciloga procura limitar los datos compartidos a lo necesario para prestar cada
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



