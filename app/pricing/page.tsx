import Link from "next/link";

const plans = [
  {name:"Free", price:"$0", note:"Para empezar", features:["2 niveles iniciales","20 ejercicios / mes","1 examen / mes","1 proyecto"]},
  {name:"Starter", price:"$199 MXN", note:"Para avanzar con estructura", features:["Todos los niveles","200 ejercicios / mes","10 evaluaciones / mes","20 consultas IA / mes","5 proyectos"]},
  {name:"Pro", price:"$499 MXN", note:"Para formación intensiva", features:["Todos los niveles","1,000 ejercicios / mes","50 evaluaciones / mes","100 consultas IA / mes","20 proyectos","Ruta SaaS e Integraciones"]},
  {name:"Enterprise", price:"Desde $899 MXN", note:"Para equipos y empresas", features:["Usuarios y equipos","Límites personalizados","Administración central","Preparado para SSO","Soporte empresarial"]}
];

export default function Pricing(){
  return <main className="wrap">
    <div className="nav"><div><span className="pill">CODEZERO</span><h1>Planes</h1></div><Link className="btn secondary" href="/">Inicio</Link></div>
    <div className="grid grid4">{plans.map(p=><div className="card" key={p.name}>
      <h2>{p.name}</h2><div className="stat">{p.price}</div><p className="muted">{p.note}</p>
      <ul>{p.features.map(f=><li key={f}>{f}</li>)}</ul>
      <Link className="btn" href={p.name==="Free"?"/login":"/checkout"}>{p.name==="Enterprise"?"Contactar":"Elegir plan"}</Link>
    </div>)}</div>
  </main>
}
