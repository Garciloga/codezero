import Link from "next/link";

const stages = [
  ["Fundamentos", "Pensamiento computacional, Python, algoritmos, Git y terminal."],
  ["Construcción", "SQL, HTML, CSS, JavaScript, backend, APIs e ingeniería de software."],
  ["Integraciones", "Webhooks, OAuth, automatización, sistemas empresariales, arquitectura y seguridad."],
  ["Capstones", "Proyectos profesionales con revisión y una entrega final de integración de extremo a extremo."],
];

export default function About() {
  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">CODEZERO</span>
          <h1>Aprende habilidades técnicas para el mundo SaaS.</h1>
          <p className="muted" style={{maxWidth:820,lineHeight:1.7}}>
            CodeZero es una ruta progresiva para personas que empiezan desde cero y quieren entender,
            construir e integrar productos digitales con criterio técnico.
          </p>
        </div>
        <Link className="btn secondary" href="/">Inicio</Link>
      </div>

      <div className="grid grid2">
        {stages.map(([title, description]) => (
          <section className="card" key={title}>
            <h2>{title}</h2>
            <p className="muted" style={{lineHeight:1.7}}>{description}</p>
          </section>
        ))}
      </div>

      <section className="card" style={{marginTop:18}}>
        <span className="pill">METODOLOGÍA</span>
        <h2>No solo leer: practicar y demostrar</h2>
        <p className="muted" style={{lineHeight:1.7,maxWidth:900}}>
          La plataforma combina lecciones, ejemplos, práctica guiada, ejercicios formativos,
          evaluaciones por nivel y proyectos Capstone. El avance es secuencial: completas el trabajo
          del nivel, demuestras dominio y desbloqueas el siguiente.
        </p>
      </section>

      <section className="card" style={{marginTop:18}}>
        <span className="pill">PARA QUIÉN</span>
        <h2>Una base técnica útil en distintos roles</h2>
        <p className="muted" style={{lineHeight:1.7,maxWidth:900}}>
          Está pensado para estudiantes y profesionales que quieren desarrollar criterio técnico,
          incluyendo personas interesadas en desarrollo, soporte técnico, Customer Success técnico,
          Onboarding, Integraciones, Solutions Engineering y operaciones SaaS.
        </p>
      </section>

      <section className="card" style={{marginTop:18}}>
        <span className="pill">TRANSPARENCIA</span>
        <h2>La duración es una estimación de ruta</h2>
        <p className="muted" style={{lineHeight:1.7,maxWidth:900}}>
          Las horas indicadas por nivel incluyen estudio, práctica, ejercicios, evaluaciones,
          proyectos y trabajo independiente. El contenido editorial continúa evolucionando y se
          amplía de forma progresiva.
        </p>
      </section>

      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:20}}>
        <Link className="btn" href="/login">Empezar gratis</Link>
        <Link className="btn secondary" href="/pricing">Ver planes</Link>
      </div>
    </main>
  );
}
