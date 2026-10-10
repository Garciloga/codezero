import LocalizedContent from "../components/localization/server";
import Link from "next/link";

const faqs = [
  {
    q: "¿Necesito experiencia previa?",
    a: "No. Garciloga comienza con pensamiento computacional y avanza de forma progresiva hacia programación, web, backend e integraciones SaaS.",
  },
  {
    q: "¿Qué incluye el plan Free?",
    a: "El plan Free permite acceder al Nivel 1 y a sus actividades dentro de los límites publicados en la plataforma. Los niveles posteriores requieren un plan compatible.",
  },
  {
    q: "¿Las horas del programa son horas de video?",
    a: "No. Las horas son una estimación de ruta e incluyen lectura, práctica, ejercicios, evaluaciones, proyectos y trabajo independiente.",
  },
  {
    q: "¿Cómo se desbloquean los niveles?",
    a: "El avance es secuencial. Debes completar las lecciones y aprobar la evaluación correspondiente. En niveles con proyecto Capstone, el proyecto también debe ser aprobado.",
  },
  {
    q: "¿Obtengo un certificado?",
    a: "Los certificados y exámenes están incluidos en los planes, dentro de sus límites y requisitos académicos. No cobramos un cargo separado por emitir el certificado.",
  },
  {
    q: "¿Pueden usar Garciloga personas menores de edad?",
    a: "Sí. Cuando corresponda deben contar con autorización y supervisión de su madre, padre o tutor legal. Las compras deben realizarse con autorización del adulto responsable y del titular del método de pago.",
  },
  {
    q: "¿Cómo funcionan las suscripciones?",
    a: "Los planes de pago se gestionan con Stripe y se cobran de forma recurrente según el precio mostrado antes de contratar. Las suscripciones pueden administrarse desde el portal de facturación cuando exista una suscripción activa.",
  },
  {
    q: "¿Hay reembolsos?",
    a: "No hay reembolsos automáticos. Se revisan errores de cobro, cargos duplicados y los casos en que la legislación aplicable exija una devolución. Consulta la política de cancelaciones y reembolsos.",
  },
  {
    q: "¿El Tutor IA está incluido?",
    a: "El Tutor IA no está disponible actualmente.",
  },
  {
    q: "¿Dónde puedo pedir soporte o ejercer derechos de privacidad?",
    a: "Puedes usar la página de contacto o escribir al correo publicado en Garciloga. Desde tu perfil también puedes descargar una copia de tus datos de cuenta y aprendizaje.",
  },
];

export default function FAQPage() {
  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">FAQ</span>
          <h1>Preguntas frecuentes</h1>
          <p className="muted" style={{maxWidth:760,lineHeight:1.7}}>
            Respuestas rápidas sobre acceso, aprendizaje, suscripciones, privacidad y certificación.
          </p>
        </div>
        <Link className="btn secondary" href="/">Inicio</Link>
      </div>

      <section className="card"><h2>¿Administras un equipo?</h2><p>Consulta el tutorial ilustrado de asignación, las competencias y los cambios previstos.</p><Link className="btn" href="/guides/companies">Guía para empresas</Link></section>

      <div style={{display:"grid",gap:14}}>
        {faqs.map((item) => (
          <section className="card" key={item.q}>
            <h2 style={{marginTop:0,fontSize:22}}>{item.q}</h2>
            <p className="muted" style={{lineHeight:1.7,marginBottom:0}}>{item.a}</p>
          </section>
        ))}
      </div>

      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:20}}>
        <Link className="btn" href="/login">Empezar gratis</Link>
        <Link className="btn secondary" href="/pricing">Ver planes</Link>
        <Link className="btn secondary" href="/contact">Contacto</Link>
      </div>
    </main></LocalizedContent>
  );
}

