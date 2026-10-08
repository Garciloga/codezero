import Link from 'next/link';
import { redirect } from 'next/navigation';
import LocalizedContent from '../components/localization/server';
import { workspaceUser } from '../../lib/workspace-server';
import { LEADERSHIP_LEARNING, LEADERSHIP_SOURCE } from '../../lib/leadership-learning';
import { translatedMetadata } from '../../lib/localization/metadata';
export async function generateMetadata() { return translatedMetadata({ title: 'Liderazgo y procesos', robots: { index: false, follow: false } }); }
export default async function LeadershipPage() {
  const session = await workspaceUser();
  if (!session) redirect('/login');
  return <LocalizedContent><main className="wrap"><h1>Liderazgo y procesos</h1><p>Una guía introductoria para practicar cómo cambia tu responsabilidad: ejecutar, supervisar, coordinar y dirigir.</p><p>Estos ejercicios son de autoestudio. No generan una calificación, un certificado ni permisos de organización. Los cursos completos están en el roadmap.</p>
    <div className="grid grid2">{LEADERSHIP_LEARNING.map((item, i) => <article className="card" key={item.role}><span className="pill">{i + 1} · {item.role}</span><h2>{item.focus}</h2><p>{item.lesson}</p><h3>Practica una decisión</h3><p>{item.scenario}</p><details><summary>Ver una decisión razonada</summary><p>{item.decision}</p></details><h3>Tu entregable</h3><p>{item.exercise}</p><h3>Revisa tu trabajo</h3><ul>{item.rubric.map(r => <li key={r}>{r}</li>)}</ul></article>)}</div>
    <section className="card public-section"><h2>Cómo continuar</h2><p>Practica con los procesos y casos de tu puesto, registra qué decidiste y qué evidencia cambiaría tu decisión. Las mentorías tratarán puestos, procesos y liderazgo.</p><div className="public-actions"><Link prefetch={false} className="btn" href="/practice">Practicar decisiones por puesto</Link><Link prefetch={false} className="btn secondary" href="/roadmap">Ver próximos cursos</Link></div><p>Referencia ocupacional: <a href={LEADERSHIP_SOURCE} target="_blank" rel="noreferrer">O*NET · Gestión de operaciones</a>. El contenido de esta guía es una síntesis educativa original.</p></section>
  </main></LocalizedContent>;
}
