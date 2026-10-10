import 'server-only';
import {cache} from 'react';
import {roleTrainingSession,trainingPerson} from './role-training-server';
import {readWorkspacePages} from './workspace-pages';
import {POSITION_ITEMS,POSITION_PROGRAMS,positionProjectApproved} from './position-curriculum';
import {isUuid} from './workspace-sandbox';
const CATALOG_BATCH=100;
export const positionState=cache(async (org:string|null)=>{
 const session=await roleTrainingSession();if(!session)return null;
 if(org&&!isUuid(org))return null;
 if(org){const {data,error}=await session.supabase.from('organization_memberships').select('user_id').eq('organization_id',org).eq('user_id',session.user.id).eq('active',true).maybeSingle();if(error)throw Error('POSITION_UNAVAILABLE');if(!data)return null;}
 const person=await trainingPerson(session.user.id,org);if(!person)return null;
 const records=await readWorkspacePages<{id:string;activity_id:number;answers:number[];draft:string;created_at:string;assistance:string}>((a,b)=>{
 let q=session.supabase.from('learning_practice_submissions').select('id,activity_id,answers,draft,created_at,assistance').eq('user_id',session.user.id);q=org?q.eq('organization_id',org):q.is('organization_id',null);return q.order('created_at').order('id').range(a,b);});
 // Keys are looked up in batches: a single request with every program's keys exceeds URL limits.
 const keys=POSITION_ITEMS.map(a=>a.key);const batches=Array.from({length:Math.ceil(keys.length/CATALOG_BATCH)},(_,i)=>keys.slice(i*CATALOG_BATCH,(i+1)*CATALOG_BATCH));
 const pages=await Promise.all(batches.map(batch=>session.supabase.from('learning_activity_catalog').select('id,content_key').in('content_key',batch).eq('active',true)));
 const error=pages.find(p=>p.error)?.error??null;const catalog=pages.flatMap(p=>p.data??[]);
 if(records.error||error)throw Error('POSITION_UNAVAILABLE');
 const keyById=new Map(catalog.map(a=>[a.id,a.content_key]));
 const submissions=(records.data??[]).map(a=>({...a,key:keyById.get(a.activity_id)}));
 // A submission alone never means a professional lesson was approved.
 // Only a fully correct server-graded decision set qualifies as completed.
 const byKey=new Map(POSITION_ITEMS.map(item=>[item.key,item]));
 const completed=new Set(submissions.filter(s=>{
  const item=byKey.get(s.key??'');
  if(!item)return false;
  if(item.type!=='lesson')return true;
  return Array.isArray(s.answers)&&s.answers.length===item.decisions.length&&
   item.decisions.every((decision,i)=>s.answers[i]===decision.correct);
 }).map(s=>s.key));
 // Progress is computed per position; no client-supplied answer keys decide unlocks.
 const progress=Object.fromEntries(Object.values(POSITION_PROGRAMS).map(program=>{
  const passed=new Set<number>();
  for(const exam of program.exams){const ids=submissions.filter(s=>s.key===exam.key).map(s=>s.id);if(ids.some(id=>person.evidence.filter(e=>e.activity_key===exam.key&&(e as {submission_id?:string}).submission_id===id&&e.review_source==='auto'&&Object.values(e.competency_scores).some(v=>v===1)).length>=4))passed.add(exam.level);}
  const projects=new Set(program.projects.filter(a=>positionProjectApproved(person.evidence,a.key,org)).map(a=>a.level));
  return [program.key,{passed,projects}];
 }));
 return {session,person,submissions,completed,progress,position:person.position};
});
