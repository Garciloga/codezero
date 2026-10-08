import Link from 'next/link';
import {createServerSupabase} from '../../lib/supabase-server';
import {nextLearningStep,type NextStep} from '../../lib/next-learning-step';
import {findTrainingActivity} from '../../lib/role-training-content';
import LocalizedContent from './localization/server';
export default async function NextStepCard({userId,org,nextLevel,progress,routeLesson}:{userId:string;org:string|null;nextLevel:number|null;progress:number;routeLesson:{slug:string;title:string;minutes:number|null}|null}){
 const s=await createServerSupabase();
 const [assignments,evidence,partial,latest]=await Promise.all([
 org?s.from('learning_assignments').select('activity_key,activity_type,activity_id,title,due_at').eq('organization_id',org).eq('user_id',userId).order('due_at',{ascending:true,nullsFirst:false}):Promise.resolve({data:[],error:null}),
 org?s.from('learning_evidence').select('activity_key,completed').eq('organization_id',org).eq('user_id',userId):Promise.resolve({data:[],error:null}),
 s.from('lesson_progress').select('lesson_id,status,lessons(slug,estimated_minutes,levels(level_number))').eq('user_id',userId).neq('status','completed').limit(1),
 s.from('project_submissions').select('status,created_at,level_projects(title)').eq('user_id',userId).order('created_at',{ascending:false}).limit(1),
 ]);
 if(assignments.error||evidence.error||partial.error||latest.error)throw Error('NEXT_STEP_UNAVAILABLE');
 const pending=(assignments.data??[]).filter(a=>!evidence.data?.some(e=>e.activity_key===a.activity_key&&e.completed));
 const {data:catalog,error:catalogError}=pending.some(a=>a.activity_type==='route_unit')?await s.from('learning_activity_catalog').select('id,content_key').in('id',pending.filter(a=>a.activity_type==='route_unit').map(a=>a.activity_id)):{data:[],error:null};
 if(catalogError)throw Error('NEXT_STEP_UNAVAILABLE');
 const tasks:NextStep[]=pending.map(a=>{const activity=findTrainingActivity(catalog?.find(c=>c.id===a.activity_id)?.content_key??'');return {key:a.activity_key,title:a.title,href:a.activity_type==='route_unit'&&activity?`/role-training?organization_id=${org}&route=${activity.route==='common'?'customer_success':activity.route}&activity=${activity.key}`:`/teams/${org}/tasks`,due:a.due_at,minutes:activity?Math.round(activity.hours*60):null};});
 const inProgress:NextStep[]=(partial.data??[]).flatMap((p:any)=>{const lesson=Array.isArray(p.lessons)?p.lessons[0]:p.lessons,level=Array.isArray(lesson?.levels)?lesson.levels[0]:lesson?.levels;return lesson?.slug&&level?.level_number?[{key:String(p.lesson_id),title:'Retoma tu lección',href:`/learn/${level.level_number}/${lesson.slug}`,due:null,minutes:lesson.estimated_minutes??null}]:[];});
 const route=nextLevel?{key:'route',title:routeLesson?.title??(progress===0?'Tu primer paso':'Continúa tu ruta'),href:routeLesson?`/learn/${nextLevel}/${routeLesson.slug}`:`/learn/${nextLevel}`,due:null,minutes:routeLesson?.minutes??null}:null;
 const next=nextLearningStep(tasks,inProgress,route),last=latest.data?.[0] as any;
 return <LocalizedContent><section className="card next-step primary"><span className="pill">Tu siguiente paso</span><h2>{next?.title??'Tu ruta está completada'}</h2><p>{next?.due?'Prioridad: una actividad asignada con fecha.':inProgress.length?'Continúa lo que ya empezaste.':'Avanza a tu ritmo con el siguiente nivel disponible.'}</p>{next?.due&&<p><time dateTime={next.due}>{next.due.slice(0,10)}</time></p>}{next?.minutes&&<p>{next.minutes} min</p>}<Link prefetch={false} className="btn" href={next?.href??'/certificates'}>{progress===0&&!tasks.length?'Empezar':'Continuar'}</Link><p>Avance de la ruta · {progress}%</p><progress value={progress} max={100} aria-label="Avance de la ruta"/>
 {org&&tasks.length>0&&<details><summary>Asignaciones con fecha</summary><ul>{tasks.filter(a=>a.due).map(a=><li key={a.key}><Link prefetch={false} href={a.href}>{a.title}</Link> · <time dateTime={a.due!}>{a.due?.slice(0,10)}</time></li>)}</ul></details>}
 {last&&<p>Última entrega · <span translate="no">{(Array.isArray(last.level_projects)?last.level_projects[0]:last.level_projects)?.title}</span> · {last.status==='approved'?'Aprobada':last.status==='needs_revision'?'Requiere cambios':'En revisión'}</p>}</section></LocalizedContent>;
}
