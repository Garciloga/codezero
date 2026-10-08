import {notFound,redirect} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import LocalizedContent from '../../components/localization/server';
import MixedLevels from '../../components/enterprise/mixed-levels';
import MixedCodeEditor from '../../components/mixed-code-editor';
import {mixedReleaseEnabled,mixedArtifacts} from '../../../lib/mixed-role-server';
import {roleTrainingSession,trainingPerson} from '../../../lib/role-training-server';
import {MIXED_UNITS} from '../../../lib/mixed-role-content';
import {mixedLevels,WORK_TYPES,WORK_TYPE_NAMES,WORK_TYPE_ICONS} from '../../../lib/mixed-role-model';
import {MIXED_SCENARIOS,TOOL_FIELDS,mixedStarter} from '../../../lib/mixed-role-scenarios';
import {findTrainingActivity,TRAINING_NOTICE} from '../../../lib/role-training-content';
import {COMPETENCIES} from '../../../lib/competency-matrix';
import {hasCustomerSuccessCourse} from '../../../lib/customer-success-course';
import {isUuid} from '../../../lib/workspace-sandbox';
import {codeRuntimeConfiguration} from '../../../lib/code-runtime-policy';
import {serverTranslator} from '../../../lib/localization/server';
export default async function MixedRoute({searchParams}:{searchParams:Promise<{unit?:string;step?:string;type?:string;organization_id?:string;result?:string}>}){
 if(!await mixedReleaseEnabled())notFound();const session=await roleTrainingSession();if(!session)redirect('/login');
 if(!hasCustomerSuccessCourse(session.profile))redirect('/role-training');
 const query=await searchParams,org=query.organization_id??null;if(org&&!isUuid(org))notFound();
 if(org){const {data,error}=await session.supabase.from('organization_memberships').select('user_id').eq('organization_id',org).eq('user_id',session.user.id).eq('active',true).maybeSingle();if(error||!data)notFound();}
 const person=await trainingPerson(session.user.id,org);if(!person)notFound();
 const selected=query.unit??MIXED_UNITS.find(u=>u.positions.includes(person.profile?.position_key??''))?.key??MIXED_UNITS[0].key;
 const unit=MIXED_UNITS.find(u=>u.key===selected);if(!unit)notFound();
 const artifacts=await mixedArtifacts(session.user.id,org)??[];const latest=(key:string)=>artifacts.find(a=>a.step_key===key)??null;
 const step=query.step?unit.steps.find(s=>s.key===query.step):null;if(query.step&&!step)notFound();
 const index=step?unit.steps.indexOf(step):-1,previous=index>0?latest(unit.steps[index-1].key):null;
 const base='/role-training/mixed?unit='+unit.key+(org?'&organization_id='+org:'');const t=await serverTranslator();const runtime=codeRuntimeConfiguration(process.env);
 const source=step?findTrainingActivity(step.sourceKey):null;
 const isTechnical=step?.format==='python'||step?.format==='sql';
 const ready=index<=0||previous!==null;
 return <LocalizedContent><main className="wrap mixed-route"><nav className="mixed-tabs" aria-label="Rutas por puesto">{MIXED_UNITS.map(u=><Link prefetch={false} aria-current={u.key===unit.key?'page':undefined} key={u.key} href={'/role-training/mixed?unit='+u.key+(org?'&organization_id='+org:'')}>{u.title}</Link>)}</nav><p>{unit.company} · {unit.title}</p><h1>{step?step.title:unit.caseTitle}</h1><p>{TRAINING_NOTICE}</p>{query.result==='saved'&&<p role="status">Cambios guardados. La autoevaluación permanece provisional hasta revisión.</p>}
 <MixedLevels levels={mixedLevels(person.evidence,person.profile)}/>
 {!step?<><section className="card"><h2>Actividades intercaladas</h2><p>Ocho actividades: dos de cada tipo, conectadas en un solo caso.</p><nav className="mixed-tabs" aria-label="Filtrar actividades"><Link prefetch={false} href={base}>Todas</Link>{WORK_TYPES.map(type=><Link prefetch={false} key={type} href={base+'&type='+type}>{WORK_TYPE_NAMES[type]}</Link>)}</nav></section><ol className="mixed-step-list">{unit.steps.map((s,i)=>query.type&&query.type!==s.type?null:<li key={s.key} value={i+1} className={'card mixed-step '+s.type}><div><span className="pill">{WORK_TYPE_ICONS[s.type]} {WORK_TYPE_NAMES[s.type]}</span><h2><Link prefetch={false} href={base+'&step='+encodeURIComponent(s.key)}>{s.title}</Link></h2><p>{COMPETENCIES[s.primary]}</p></div><p>{latest(s.key)?'Entregada para revisión':'Pendiente'}</p></li>)}</ol></>:source&&<section className={'card mixed-activity '+step.type}><p>{index+1} / 8 · {WORK_TYPE_NAMES[step.type]} · {COMPETENCIES[step.primary]}</p><p>{step.task}</p><p><Link prefetch={false} href={base}>Volver a mi ruta</Link></p>
 {index>0&&<section className="card"><h2>Vienes de</h2><p>{unit.steps[index-1].title}</p>{previous?<><p>{previous.created_at.slice(0,10)} · {previous.submission_id}</p><pre translate="no">{previous.draft}</pre><pre translate="no">{JSON.stringify(previous.payload.fields??{},null,2)}</pre>{Boolean(previous.payload.output)&&<pre translate="no">{String(previous.payload.output)}</pre>}</>:<p>Entrega la actividad anterior para continuar con sus datos.</p>}</section>}
 <details><summary>Cuenta Faro · datos ficticios del caso</summary><pre translate="no">{JSON.stringify(MIXED_SCENARIOS[unit.key],null,2)}</pre></details><details><summary>Lección y rúbrica reutilizadas</summary><p>{source.lesson}</p><ul>{source.rubric.map(r=><li key={r}>{r}</li>)}</ul><p>{source.example}</p></details>
 <form method="post" action="/api/role-training/mixed"><input type="hidden" name="step" value={step.key}/><input type="hidden" name="request_id" value={randomUUID()}/>{org&&<input type="hidden" name="organization_id" value={org}/>}<input type="hidden" name="previous_submission" value={previous?.submission_id??''}/>
 <fieldset disabled={!ready}><legend>{step.title}</legend>
 {isTechnical?(runtime?<MixedCodeEditor key={step.key} initialCode={mixedStarter(unit,step,previous)} language={step.format as 'python'|'sql'} runtimeOrigin={runtime.runtimeOrigin} appOrigin={runtime.appOrigin}/>:<p role="alert">El motor aislado no está disponible. Intenta nuevamente.</p>):null}
 {step.format==='simulation'&&<section className="mixed-simulation"><h3>{step.category}</h3><p>Simulación propia de una categoría de herramienta. No conecta con servicios externos.</p>{(TOOL_FIELDS[step.category??'']??[]).map((field,i)=><label key={field}>{field}<textarea name={'tool_'+i} rows={2} maxLength={600} required/></label>)}</section>}
 {source.decisions.map((q,i)=><fieldset key={i}><legend>{q.prompt}</legend>{q.options.map((option,n)=><label key={n}><input type="radio" name={'decision_'+i} value={n} required/>{option}</label>)}</fieldset>)}
 <label>Tu entregable, con datos ficticios<textarea name="draft" rows={8} minLength={120} maxLength={12000} required placeholder={t(source.template)}/></label><label>Apoyo usado<select name="assistance" defaultValue="guided"><option value="guided">Con guía</option><option value="independent">Sin guía</option></select></label><fieldset><legend>Autoevaluación guiada por competencia (no es aprobación humana)</legend>{source.competencies.map(k=><label key={k}>{COMPETENCIES[k]}<select name={'score_'+k} required defaultValue=""><option value="" disabled>0–4</option>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n} / 4</option>)}</select></label>)}</fieldset><button className="btn" disabled={!!isTechnical&&!runtime}>Enviar para revisión humana</button></fieldset>
 </form>{index<7&&<p><Link prefetch={false} href={base+'&step='+encodeURIComponent(unit.steps[index+1].key)}>Siguiente actividad</Link> · {unit.steps[index+1].title}</p>}
 </section>}
 </main></LocalizedContent>;
}
