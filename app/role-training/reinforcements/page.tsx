import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import LocalizedContent from '../../components/localization/server';
import {roleTrainingEnabled,roleTrainingSession} from '../../../lib/role-training-server';
import {hasCustomerSuccessCourse} from '../../../lib/customer-success-course';
import {isUuid} from '../../../lib/workspace-sandbox';
import {PRACTICE_EXTENSIONS} from '../../../lib/workplace-practice-content';
export default async function Reinforcements({searchParams}:{searchParams:Promise<{organization_id?:string}>}) {
 if(!roleTrainingEnabled())notFound();const session=await roleTrainingSession();if(!session)redirect('/login');
 const {organization_id:org}=await searchParams;if(org&&!isUuid(org))notFound();
 if(org){const {data,error}=await session.supabase.from('organization_memberships').select('user_id').eq('organization_id',org).eq('user_id',session.user.id).eq('active',true).maybeSingle();if(error)throw Error('TRAINING_DATA_UNAVAILABLE');if(!data)notFound();}
 const paid=hasCustomerSuccessCourse(session.profile);
 return <LocalizedContent><main className="wrap"><h1>Atención, trabajo remoto e integraciones</h1><p>Practica con Faro y reutiliza las actividades existentes. Las entregas conservan su rúbrica y revisión; estos refuerzos no crean una escala ni un certificado adicional.</p>
 {[false,true].map(project=><section key={String(project)}><h2>{project?'Proyectos tipo trabajo de integraciones':'Refuerzos transversales'}</h2>{PRACTICE_EXTENSIONS.filter(a=>a.key.startsWith(project?'solutions-':'common-')).map(a=><article className="card" key={a.key} style={{marginBottom:20}}><h3>{a.title}</h3><p>{a.task}</p><p>{a.acceptance}</p>{!project||paid?<Link prefetch={false} className="btn secondary" href={'/role-training?route='+(project?'solutions':'customer_success')+'&activity='+a.key+(org?'&organization_id='+org:'')}>Abrir actividad existente</Link>:<p>Los proyectos de integraciones conservan el acceso Pro y Enterprise y el flujo de aprobación humana. No requieren conectar herramientas externas.</p>}</article>)}</section>)}
 <Link href="/employment-kit">Guía de salida laboral</Link></main></LocalizedContent>;
}
