import LocalizedDate from '../../components/localization/date';
import LocalizedContent from "../../components/localization/server";
import {redirect,notFound} from 'next/navigation';
import Link from 'next/link';
import {workspaceEnabled} from '../../../lib/workspace-sandbox';
import {workspaceUser} from '../../../lib/workspace-server';
import {requireAdmin,createAdminSupabase} from '../../../lib/admin';
import {CS_CAPSTONE_RUBRIC} from '../../../lib/customer-success-course';
export const dynamic='force-dynamic';
export default async function Review(){if(!workspaceEnabled())notFound();const session=await workspaceUser();if(!session)redirect('/login');try{await requireAdmin(session.user.id);}catch{notFound();}
 const {data,error}=await createAdminSupabase().from('cs_course_projects').select('id,draft,status,created_at').eq('status','submitted').order('created_at').limit(50);if(error)throw Error('REVIEW_UNAVAILABLE');
 return <LocalizedContent><main className="wrap"><h1>Revisión de proyectos Customer Success</h1><p>Evalúa evidencia según la rúbrica. Cada criterio vale 25 puntos; aprobar requiere 70/100. No asumas calidad por longitud de texto.</p><ul>{CS_CAPSTONE_RUBRIC.map(x=><li key={x}>{x}</li>)}</ul>{!data?.length&&<p>No hay proyectos pendientes.</p>}{data?.map(p=><section className="card" key={p.id}><h2>Entrega del <LocalizedDate value={p.created_at} /></h2><pre translate="no" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{p.draft}</pre><form action="/api/customer-success/review" method="post"><input type="hidden" name="project_id" value={p.id}/>{['Diagnóstico','Plan','Verificación','Comunicación'].map((name,i)=><label key={name}>{name}, 0–25<input type="number" name={'criterion_'+i} min={0} max={25} required/></label>)}<label>Feedback con evidencia y siguiente paso<textarea name="feedback" minLength={80} maxLength={4000} rows={5} required/></label><button className="btn">Guardar revisión</button></form></section>)}<Link href="/admin">Volver a administración</Link></main></LocalizedContent>;
}

