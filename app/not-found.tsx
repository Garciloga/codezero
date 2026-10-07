import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap">
      <div className="card" style={{maxWidth:720,margin:"70px auto",textAlign:"center"}}>
        <span className="pill">404</span>
        <h1>No encontramos esta página</h1>
        <p className="muted">
          El enlace puede haber cambiado o el contenido no estar disponible.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <Link className="btn" href="/">Ir al inicio</Link>
          <Link className="btn secondary" href="/dashboard">Mi CodeZero</Link>
        </div>
      </div>
    </main>
  );
}
