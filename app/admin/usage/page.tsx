import {redirect} from 'next/navigation';
import Link from 'next/link';
import {createServerSupabase} from '../../../lib/supabase-server';
import {createAdminSupabase,requireOwner} from '../../../lib/admin';
import LocalizedContent from '../../components/localization/server';
type Row={user_id:string;email:string;full_name:string|null;clicks:number;visits:number;active_days:number;last_seen:string|null;total_users:number};
export default async function Usage({searchParams}:{searchParams:Promise<{days?:string;order?:string;q?:string;page?:string}>}) {
  const query=await searchParams;
  const {data:{user}}=await (await createServerSupabase()).auth.getUser();
  if(!user)redirect('/login');try{await requireOwner(user.id);}catch{redirect('/dashboard');}
  const days=[7,30,90].includes(Number(query.days))?Number(query.days):30;
  const order=['least','most','recent'].includes(query.order??'')?query.order!:'least';
  const q=(typeof query.q==='string'?query.q:'').slice(0,100),page=Math.min(10000,Math.max(1,Math.floor(Number(query.page)||1)));
  const admin=createAdminSupabase();
  const [report,start]=await Promise.all([
    admin.rpc('platform_usage_report',{p_actor:user.id,p_days:days,p_order:order,p_search:q,p_page:page}),
    admin.from('platform_usage_start').select('started_at').eq('singleton',true).single()
  ]);
  const rows=(report.data??[]) as Row[],total=Number(rows[0]?.total_users??0);
  const href=(p:number)=>'/admin/usage?'+new URLSearchParams({days:String(days),order,q,page:String(p)});
  return <LocalizedContent><main className="wrap usage-page">
    <div className="nav"><div><span className="pill">PROPIETARIO</span><h1>Uso de la plataforma</h1><p className="muted">Identifica quién usa más y menos Garciloga para ofrecer acompañamiento.</p></div><Link prefetch={false} className="btn secondary" href="/admin">Volver al panel</Link></div>
    <section className="card"><h2>Actividad registrada</h2><p>Contamos clics en controles, visitas a secciones y días con actividad. Las cuentas activas sin eventos aparecen con cero. No mide aprendizaje, tiempo de trabajo ni desempeño; puede omitir actividad cuando el navegador bloquea el registro.</p><p>La medición comienza con esta actualización. No hay historial de clics anterior. El propietario y las vistas de soporte como alumno quedan excluidos. Solo el propietario puede ver este ranking.</p>{start.data&&<p><b>Inicio del registro:</b> <span translate="no">{new Date(start.data.started_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</span> · <b>Zona horaria:</b> <span translate="no">America/Mexico_City</span></p>}
    <form method="get" className="usage-filters" data-usage-exclude><label>Periodo<select name="days" defaultValue={days}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option></select></label><label>Ordenar<select name="order" defaultValue={order}><option value="least">Menos clics primero</option><option value="most">Más clics primero</option><option value="recent">Actividad más reciente</option></select></label><label>Buscar persona<input name="q" type="search" defaultValue={q} maxLength={100} placeholder="Nombre o correo"/></label><button className="btn">Aplicar filtros</button></form></section>
    {report.error||start.error?<p role="alert" className="card">No pudimos cargar las métricas. Vuelve a intentarlo; no mostramos ceros como sustituto de datos ausentes.</p>:<section className="card"><h2>Usuarios activos</h2><p><b>{total}</b> <span>personas en este filtro</span></p>
    {!rows.length?<p>No hay personas en esta página. Ajusta los filtros o vuelve a la página anterior.</p>:<div className="vivo-table-scroll usage-table"><table><caption>Uso registrado en el periodo seleccionado</caption><thead><tr><th scope="col">Persona</th><th scope="col">Clics</th><th scope="col">Visitas</th><th scope="col">Días activos</th><th scope="col">Última actividad</th></tr></thead><tbody>{rows.map(row=><tr key={row.user_id}><th scope="row"><strong translate="no">{row.full_name||row.email}</strong><div className="muted" translate="no">{row.email}</div></th><td>{Number(row.clicks)}</td><td>{Number(row.visits)}</td><td>{Number(row.active_days)}</td><td>{row.last_seen?<time dateTime={row.last_seen} translate="no">{new Date(row.last_seen).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</time>:<span>Sin actividad registrada</span>}</td></tr>)}</tbody></table></div>}
    <nav className="usage-pagination" aria-label="Páginas de métricas">{page>1&&<Link prefetch={false} className="btn secondary" href={href(page-1)}>Anterior</Link>}<span><span>Página</span> {page}</span>{page*50<total&&<Link prefetch={false} className="btn secondary" href={href(page+1)}>Siguiente</Link>}</nav></section>}
  </main></LocalizedContent>;
}
