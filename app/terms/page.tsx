import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="wrap">
      <div className="nav">
        <div><span className="pill">LEGAL</span><h1>Términos de uso</h1></div>
        <Link className="btn secondary" href="/">Inicio</Link>
      </div>
      <article className="card" style={{lineHeight:1.75}}>
        <p>Última actualización: 6 de octubre de 2026.</p>

        <h2>Responsable del servicio</h2>
        <p>
          CodeZero es operado por <b>Isaac López Garcia</b>, también identificado públicamente
          como <b>Isaac Garciloga</b>, en calidad de persona física con operación en
          Ciudad de México, México.
        </p>
        <p>
          Contacto general: <a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a><br />
          Teléfono: <a href="tel:+525533881002">+52 55 3388 1002</a>
        </p>

        <h2>Objeto del servicio</h2>
        <p>
          CodeZero ofrece contenido educativo, ejercicios, evaluaciones, proyectos y funciones
          digitales para aprender programación, SaaS e integraciones. El acceso a determinadas
          funciones depende del plan contratado.
        </p>

        <h2>Usuarios menores de edad</h2>
        <p>
          CodeZero puede ser utilizado por personas menores y mayores de 18 años. Cuando la persona
          usuaria sea menor de edad, deberá contar con la autorización y supervisión de su madre,
          padre o tutor legal cuando corresponda. La contratación de planes de pago por una persona
          menor deberá realizarse con autorización del adulto responsable.
        </p>

        <h2>Cuenta y acceso</h2>
        <p>
          Debes proporcionar información veraz, proteger tus credenciales y usar tu cuenta de
          forma personal salvo que un plan empresarial permita lo contrario. Podemos restringir
          cuentas ante uso abusivo, fraude, intentos de vulneración o incumplimiento de estos términos.
        </p>

        <h2>Suscripciones</h2>
        <p>
          Los planes de pago se cobran de forma recurrente a través de Stripe. El precio,
          periodicidad y moneda se muestran antes de confirmar la compra. Puedes administrar o
          cancelar una suscripción desde el portal de facturación disponible en tu perfil.
        </p>

        <h2>Contenido educativo</h2>
        <p>
          CodeZero busca ofrecer material útil y actualizado, pero no garantiza resultados
          profesionales, laborales, académicos ni comerciales específicos. El contenido no
          sustituye asesoría profesional especializada.
        </p>

        <h2>Uso permitido</h2>
        <p>
          No puedes intentar acceder a datos de otros usuarios, eludir límites de plan, extraer
          soluciones privadas, interferir con la infraestructura o usar el servicio para actividades ilegales.
        </p>

        <h2>Disponibilidad</h2>
        <p>
          Podemos modificar, mantener o interrumpir temporalmente partes del servicio para mejorar
          seguridad, rendimiento o funcionalidad. Procuraremos minimizar interrupciones.
        </p>

        <h2>Legislación aplicable</h2>
        <p>
          Estos términos se interpretarán conforme a la legislación aplicable en México, sin
          perjuicio de derechos irrenunciables que correspondan al usuario por ley.
        </p>

        <h2>Cambios</h2>
        <p>
          Podemos actualizar estos términos. Los cambios materiales se reflejarán en esta página
          con una nueva fecha de actualización.
        </p>

        <p className="muted">
          Documento operativo provisional. Antes de un lanzamiento comercial amplio conviene una
          revisión legal y fiscal profesional.
        </p>
      </article>
    </main>
  );
}
