import 'server-only';
import {cache} from 'react';
import {roleTrainingSession,trainingPerson} from './role-training-server';
import {readWorkspacePages} from './workspace-pages';
import {POSITION_ITEMS,CS_CURRICULUM_LEVELS,positionProjectApproved} from './position-curriculum';
import {isUuid} from './workspace-sandbox';
export const positionState=cache(async (org:string|null)=>{
 const session=await roleTrainingSession();if(!session)return null;
 if(org&&!isUuid(org))return null;
 if(org){const {data,error}=await session.supabase.from('organization_memberships').select('user_id').eq('organization_id',org).eq('user_id',session.user.id).eq('active',true).maybeSingle();if(error)throw Error('POSITION_UNAVAILABLE');if(!data)return null;}
 const person=await trainingPerson(session.user.id,org);if(!person)return null;
 const records=await readWorkspacePages<{id:string;activity_id:number;answers:number[];draft:string;created_at:string;assistance:string}>((a,b)=>{
 let q=session.supabase.from('learning_practice_submissions').select('id,activity_id,answers,draft,created_at,assistance').eq('user_id',session.user.id);q=org?q.eq('organization_id',org):q.is('organization_id',null);return q.order('created_at').order('id').range(a,b);});
 const {data:catalog,error}=await session.supabase.from('learning_activity_catalog').select('id,content_key').in('content_key',POSITION_ITEMS.map(a=>a.key)).eq('active',true);
 if(records.error||error)throw Error('POSITION_UNAVAILABLE');
 const keyById=new Map((catalog??[]).map(a=>[a.id,a.content_key]));
 const submissions=(records.data??[]).map(a=>({...a,key:keyById.get(a.activity_id)}));
 const completed=new Set(submissions.map(s=>s.key));
 const passed=new Set<number>();
 for(const l of CS_CURRICULUM_LEVELS){const key='position-cs-exam-'+l.number;const ids=submissions.filter(s=>s.key===key).map(s=>s.id);if(ids.some(id=>person.evidence.filter(e=>e.activity_key===key&&(e as any).submission_id===id&&e.review_source==='auto'&&Object.values(e.competency_scores).some(v=>v===1)).length>=4))passed.add(l.number);}
 // Evidence query also includes submission_id; no client-supplied answer keys decide unlocks.
 const projects=new Set([8,15].filter(n=>positionProjectApproved(person.evidence,'position-cs-project-'+n,org)));
 return {session,person,submissions,completed,passed,projects};
});
