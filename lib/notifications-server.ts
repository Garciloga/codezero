import 'server-only';
import {workspaceUser} from './workspace-server';
import {createAdminSupabase} from './admin';
import {RELEASE_NOTES} from './release-notes';
import {WEEKLY_CASES,WEEKLY_CASE_SEEDS,publishedWeeklyCases} from './weekly-cases';
import type {Notice,NoticeType} from './notification-types';
/** Event content is read with the user's RLS client. Never copy message or submission bodies. */
export async function loadNotices(){
 const s=await workspaceUser();if(!s)return null;const cutoff=new Date(Date.now()-90*86400000).toISOString(),events:Omit<Notice,'read'>[]=[];
 const results=await Promise.all([
 s.supabase.from('learning_assignments').select('organization_id,activity_key,created_at,due_at,title').eq('user_id',s.user.id).gte('created_at',cutoff).order('created_at',{ascending:false}).limit(80),
 s.supabase.from('learning_evidence_history').select('id,organization_id,observed_at').eq('user_id',s.user.id).in('review_source',['manager','admin']).gte('observed_at',cutoff).order('observed_at',{ascending:false}).limit(80),
 s.supabase.from('learning_project_review_runs').select('submission_id,organization_id,created_at,state,current_stage,snapshot').neq('state','approved').gte('created_at',cutoff).order('created_at',{ascending:false}).limit(80),
 s.supabase.from('support_ticket_messages').select('id,ticket_id,sender_user_id,sender_role,created_at').neq('sender_user_id',s.user.id).gte('created_at',cutoff).order('created_at',{ascending:false}).limit(80),
 s.supabase.from('organization_messages').select('id,organization_id,team_id,author_id,created_at').neq('author_id',s.user.id).is('deleted_at',null).gte('created_at',cutoff).order('created_at',{ascending:false}).limit(80),
 s.supabase.from('mentoring_requests').select('id,status,created_at').eq('learner_id',s.user.id).neq('status','pending').gte('created_at',cutoff).order('created_at',{ascending:false}).limit(30),
 s.supabase.from('notice_read_states').select('event_key').eq('user_id',s.user.id).gte('read_at',cutoff),
 s.supabase.from('notice_preferences').select('disabled_types').eq('user_id',s.user.id).maybeSingle(),
 // Account email comes from verified Auth, not request input or mutable profile text.
 s.user.email_confirmed_at&&s.user.email?createAdminSupabase().from('organization_invitations').select('id,expires_at').ilike('email',s.user.email.replace(/[\\%_]/g,'\\$&')).is('accepted_at',null).is('revoked_at',null).gt('expires_at',new Date().toISOString()).limit(30):Promise.resolve({data:[],error:null}),
 ]);if(results.some(r=>r.error))throw Error('NOTIFICATIONS_UNAVAILABLE');
 const add=(id:string,type:NoticeType,title:string,href:string,at:string)=>events.push({id,type,title,href,at});
 for(const a of results[0].data??[]){const due=a.due_at&&Date.parse(a.due_at)-Date.now()<7*86400000;add('assignment:'+a.organization_id+':'+a.activity_key+(due?':due':''),'assignment',due?'Asignación próxima a vencer':'Nueva asignación','/role-training?organization_id='+a.organization_id,a.created_at);}
 for(const r of results[1].data??[])add('review:'+r.id,'review','Tu entrega recibió revisión','/role-training'+(r.organization_id?'?organization_id='+r.organization_id:''),r.observed_at);
 for(const r of results[2].data??[])if(r.snapshot?.[r.current_stage]?.reviewers?.some((p:{id:string})=>p.id===s.user.id))add('review-pending:'+r.submission_id+':'+r.current_stage,'review','Entrega pendiente de tu revisión','/role-training/review'+(r.organization_id?'?organization_id='+r.organization_id:''),r.created_at);
 for(const m of results[3].data??[])if(['owner','admin'].includes(m.sender_role))add('ticket:'+m.id,'ticket','Respuesta a tu ticket','/help/tickets/'+m.ticket_id,m.created_at);
 for(const m of results[4].data??[])add('message:'+m.id,'message','Nuevo mensaje de compañía','/teams/'+m.organization_id+'/messages'+(m.team_id?'?team='+m.team_id:''),m.created_at);
 for(const m of results[5].data??[])add('mentoring:'+m.id+':'+m.status,'mentoring','Tu solicitud de mentoría cambió de estado','/mentoring',m.created_at);
 for(const i of results[8].data??[])add('invitation:'+i.id,'invitation','Invitación a una compañía','/teams/join?id='+i.id,new Date(Date.parse(i.expires_at)-7*86400000).toISOString());
 for(const w of publishedWeeklyCases())add('weekly:'+w.key,'weekly','Caso semanal disponible','/weekly-cases',WEEKLY_CASE_SEEDS[WEEKLY_CASES.indexOf(w)][0]+'T00:00:00-06:00');
 for(const n of RELEASE_NOTES)if(n.date>=cutoff.slice(0,10))add('news:'+n.id,'news',n.title,'/news',n.date+'T00:00:00Z');
 const disabled=results[7].data?.disabled_types??[],read=new Set((results[6].data??[]).map(r=>r.event_key));
 const notices=events.filter(e=>!disabled.includes(e.type)).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,150).map(e=>({...e,read:read.has(e.id)}));return {session:s,notices,disabled};
}
