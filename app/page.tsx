import Link from "next/link";
export default function Home() {
  return <main className="wrap">
    <div className="nav"><strong>CODEZERO</strong><div><Link href="/about">Qué es</Link> &nbsp; <Link href="/pricing">Precios</Link> &nbsp; <Link href="/login">Entrar</Link></div></div>
    <section className="card" style={{marginTop:35,padding:"54px 34px"}}>
      <span className="pill">PROGRAMACIÓN · SAAS · INTEGRACIONES</span>
      <h1 style={{fontSize:48,lineHeight:1.05,maxWidth:800}}>De cero a construir y entender soluciones técnicas para SaaS.</h1>
      <p style={{fontSize:20,maxWidth:760}} className="muted">Una ruta guiada con clases, ejemplos, ejercicios, exámenes, proyectos y una especialización en APIs e integraciones empresariales.</p>
      <Link className="btn" href="/pricing">Empezar ahora</Link>
    </section>
    <div className="grid grid4" style={{marginTop:18}}>
      {["Aprendizaje progresivo","Proyectos reales","SaaS e integraciones","Progreso medible"].map((x,i)=><div className="card" key={x}><h3>{x}</h3><p className="muted">{["Desde fundamentos hasta arquitectura.","Practica con retos y evaluaciones.","APIs, OAuth, webhooks y sistemas empresariales.","Competencias, exámenes y avance por niveles."][i]}</p></div>)}
    </div>
    <footer className="muted" style={{marginTop:28,padding:"18px 0",display:"flex",gap:18,flexWrap:"wrap"}}>
      <Link href="/terms">Términos</Link>
      <Link href="/privacy">Privacidad</Link>
      <Link href="/refunds">Cancelaciones y reembolsos</Link>
    </footer>
  </main>;
}
