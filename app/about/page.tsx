import Link from "next/link";
export default function About(){
 return <main id="main-content" className="wrap"><div className="card" style={{marginTop:40,maxWidth:850,marginInline:"auto"}}>
  <span className="pill">CODEZERO</span>
  <h1>Aprende habilidades técnicas para el mundo SaaS.</h1>
  <p>CodeZero es una plataforma de aprendizaje progresivo que lleva al alumno desde fundamentos de programación hasta APIs, automatización, arquitectura e integraciones empresariales.</p>
  <h2>Qué incluye</h2>
  <ul><li>Programación desde cero.</li><li>Python, Git, SQL y desarrollo web.</li><li>Backend y APIs.</li><li>OAuth, webhooks y automatización.</li><li>Integraciones SaaS y sistemas empresariales.</li><li>Proyectos, exámenes, competencias y seguimiento de progreso.</li></ul>
  <h2>Para quién</h2><p>Personas que quieren entrar o crecer en roles técnicos, especialmente alrededor de SaaS, Customer Success técnico, Onboarding, Integraciones y Solutions Engineering.</p>
  <Link className="btn" href="/pricing">Ver planes</Link>
 </div></main>
}
