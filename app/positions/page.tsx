import Link from 'next/link';
import {redirect,notFound} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import {positionState} from '../../lib/position-server';
import {positionItem,POSITION_ITEMS,CS_CURRICULUM_LEVELS,CS_CURRICULUM_LESSONS,CS_CURRICULUM_PROJECTS,CS_CURRICULUM_OPTIONAL,POSITION_DIAGNOSTICS} from '../../lib/position-curriculum';
import {hasCustomerSuccessCourse} from '../../lib/customer-success-course';
import {localeContext,serverTranslator} from '../../lib/localization/server';
import {COMPETENCIES} from '../../lib/competency-matrix';
import ui from '../../lib/position-curricula/ui.json';
import LocalizedContent from '../components/localization/server';
import CompetencyPanel from '../components/enterprise/competency-panel';
import {roleTrainingEnabled} from '../../lib/role-training-policy';
export const dynamic='force-dynamic';
export default async function Positions({searchParams}:{searchParams:Promise<{organization_id?:string;item?:string;diagnostic?:string;result?:string;attempt?:string}>}){
 if(!roleTrainingEnabled())notFound();const params=await searchParams,org=params.organization_id??null,state=await positionState(org);if(!state){if(org)notFound();redirect('/login');}
 const {locale}=await localeContext(),t=await serverTranslator(),s=ui[locale],base='/positions'+(org?'?organization_id='+org:'');
 const link=(key:string)=>base+(org?'&':'?')+'item='+key;
 const entitled=hasCustomerSuccessCourse(state.session.profile),item=params.item?positionItem(params.item):null;if(params.item&&!item)notFound();
 const latest=params.attempt?state.submissions.find(a=>a.id===params.attempt):null;
 const title=(a:typeof POSITION_ITEMS[number])=>(a.type==='diagnostic'||a.type==='optional')&&!a.application?t(a.source.title):a.title[locale];
 const renderItem=(a:typeof POSITION_ITEMS[number])=>{
 if(a.type!=='diagnostic'&&!entitled)return <section className="card" key={a.key}><h2>{title(a)}</h2><p>{t('Este curso práctico está incluido en Pro y Enterprise, con examen y certificado sin cargo adicional al aprobar.')}</p><Link className="btn" href="/pricing">{t('Ver planes')}</Link></section>;
 const application=a.application?.[locale],questions=application?.decisions??a.decisions;
 const unlocked=!a.required||a.level<=1||state.passed.has(a.level-1),lessonsReady=CS_CURRICULUM_LESSONS.filter(l=>l.level===a.level).every(l=>state.completed.has(l.key));
 const canSubmit=(a.type==='diagnostic'||entitled)&&unlocked&&(a.type!=='exam'||(lessonsReady&&(![8,15].includes(a.level)||state.projects.has(a.level))));
 return <section className="card" key={a.key}><span className="pill">{a.type==='diagnostic'?s.diagnostic:a.type==='optional'?s.optional:s.level+' '+a.level}</span><h2>{title(a)}</h2>{a.type==='lesson'&&<><h3>{s.focus}</h3><p>{s.focusNote}</p><p><b>{title(a)}</b> · {application?.task??t(a.source.task)}</p><h3>{s.focus}</h3><p>{application?.case??t(a.source.example)}</p>{application&&<><h3>{s.rubric}</h3><p>{application.rule}</p><p>{application.evidence}</p></>}<h3>{s.process}</h3><p>{t(a.source.lesson)}</p><h3>{s.steps}</h3>{application&&<p>{application.process}</p>}<ol>{[s.step1,s.step2,s.step3].map(x=><li key={x}>{x}</li>)}</ol></>}
 {a.type==='project'&&<><p>{a.level===8?s.project1:s.project2}</p><p>{s.projectNote}</p><h3>{s.rubric}</h3><ul>{a.source.rubric.map(r=><li key={r}>{t(r)}</li>)}</ul><p>{t(a.source.task)}</p></>}
 {a.type==='exam'&&<p>{s.examNote}</p>}
 {a.type==='optional'&&<><p>{application?.process??t(a.source.lesson)}</p><p>{application?.task??t(a.source.task)}</p><p>{s.optional}</p></>}
 {canSubmit?<form action="/api/positions" method="post"><input type="hidden" name="action" value="submit"/><input type="hidden" name="item" value={a.key}/><input type="hidden" name="request_id" value={randomUUID()}/>{org&&<input type="hidden" name="organization_id" value={org}/>}<input type="hidden" name="assistance" value="guided"/>{questions.map((q,i)=><fieldset key={i}><legend>{a.type==='lesson'?s.exercise+' '+(i+1):i+1}. {application?q.prompt:t(q.prompt)}</legend>{q.options.map((o,n)=><label key={n} style={{display:'block'}}><input type="radio" required name={'q_'+i} value={n}/>{application?o:t(o)}</label>)}</fieldset>)}{a.type!=='exam'&&a.type!=='diagnostic'&&<><label>{s.draft}<textarea name="draft" rows={8} minLength={a.type==='project'?300:120} maxLength={24000} required placeholder={application?.template??t(a.source.template)}/></label><details><summary>{s.example}</summary><p>{application?.example??t(a.source.example)}</p><p style={{whiteSpace:'pre-wrap'}}>{application?.template??t(a.source.template)}</p></details></>}<button className="btn">{a.type==='exam'?s.exam:s.submit}</button></form>:<p>{!entitled?t('Este curso práctico está incluido en Pro y Enterprise, con examen y certificado sin cargo adicional al aprobar.'):!unlocked?s.locked:s.projectNote}</p>}
 {latest?.key===a.key&&<div role="status"><h3>{s.feedback}</h3><ul>{questions.map((q,i)=><li key={i}>{latest.answers[i]===q.correct?'✓':'↻'} {application?q.feedback:t(q.feedback)}</li>)}</ul></div>}
 <h3>{t('Competencias')}</h3><ul>{a.source.competencies.map(k=><li key={k}>{t(COMPETENCIES[k])}</li>)}</ul><ul>{a.source.sourceUrls.map(url=><li key={url}><a href={url} rel="noreferrer" target="_blank">{s.reference}</a></li>)}</ul>
 </section>;
 };
 return <LocalizedContent><main className="wrap workplace-route"><h1>{s.title}</h1><p>{s.intro}</p><p className="notice">{s.notice}</p>{params.result&&<p role="status">{params.result==='passed'?s.approved:params.result==='failed'?s.failed:params.result==='saved'?s.saved:s.blocked}</p>}
 <section className="card"><h2>{s.choose}</h2><form action="/api/positions" method="post"><input type="hidden" name="action" value="position"/>{org&&<input type="hidden" name="organization_id" value={org}/>}<label>{s.choose}<select name="position" defaultValue="customer_success"><option value="customer_success">Customer Success</option></select></label><button className="btn">{s.savePosition}</button></form><nav><Link href={base+(org?'&':'?')+'diagnostic=1'}>{s.diagnostic}</Link> · <Link href={base}>{s.continue}</Link> · <Link href="/role-training">{s.legacy}</Link> · <Link href="/dashboard?view=learning#my-learning-path">{s.technical}</Link></nav></section>
 <CompetencyPanel evidence={state.person.evidence} profile={state.person.profile} org={org} userId={state.session.user.id}/>
 {params.diagnostic?<><h2>{s.diagnostic}</h2><p>{s.diagnosticNote}</p>{POSITION_DIAGNOSTICS.map(renderItem)}<h3>{s.recommended}</h3><p>{t(COMPETENCIES[state.person.summary.competencies.slice().sort((a,b)=>a.level-b.level||a.count-b.count)[0].key])}</p></>:item?renderItem(item):<><h2>Customer Success</h2><div className="grid grid2">{[[15,s.level],[92,s.lessons],[184,s.exercises],[75,s.questions],[2,s.projects]].map(([n,label])=><div className="card" key={String(label)}><b>{n}</b><p>{label}</p></div>)}</div><progress max={15} value={state.passed.size} aria-label={s.approved}/><p>{state.passed.size}/15 · {s.approved}</p>{state.passed.size===15&&<p><Link href="/certificates">{s.certificate}</Link></p>}<p>{s.hours} {165.5} h</p>{CS_CURRICULUM_LEVELS.map(l=><section className="card" key={l.number}><h3>{s.level} {l.number} · {l.title[locale]} {state.passed.has(l.number)?'✓':''}</h3><ul>{CS_CURRICULUM_LESSONS.filter(a=>a.level===l.number).map(a=><li key={a.key}><Link href={link(a.key)}>{title(a)}</Link> {state.completed.has(a.key)&&'✓'}</li>)}</ul>{CS_CURRICULUM_PROJECTS.filter(a=>a.level===l.number).map(a=><p key={a.key}><Link href={link(a.key)}>{title(a)}</Link> {state.projects.has(l.number)&&'✓'}</p>)}<Link className="btn secondary" href={link('position-cs-exam-'+l.number)}>{s.exam}</Link></section>)}<h2>{s.optional}</h2><ul>{CS_CURRICULUM_OPTIONAL.map(a=><li key={a.key}><Link href={link(a.key)}>{title(a)}</Link></li>)}</ul>{org&&<Link href={'/role-training/review?organization_id='+org}>{s.review}</Link>}</>}
 </main></LocalizedContent>;
}
