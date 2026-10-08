import {boundedForm} from '../../../lib/bounded-form';
import {roleTrainingEnabled,roleTrainingSession,trainingPerson} from '../../../lib/role-training-server';
import {trustedWorkspaceMutation,isUuid} from '../../../lib/workspace-sandbox';
import {createAdminSupabase} from '../../../lib/admin';
import {hasCustomerSuccessCourse} from '../../../lib/customer-success-course';
import {findTrainingActivity,gradeTrainingDecisions} from '../../../lib/role-training-content';
import {COMPETENCIES,validScores} from '../../../lib/competency-matrix';
import {consumeRateLimit} from '../../../lib/rate-limit';

export async function POST(req:Request){
 if(!roleTrainingEnabled())return new Response(null,{status:404});
 if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});
 const session=await roleTrainingSession();if(!session)return new Response(null,{status:401});
 const rate=await consumeRateLimit('role-training:'+session.user.id,40,600);if(!rate.allowed)return new Response(null,{status:429});
 let f:FormData;try{f=await boundedForm(req,60000);}catch{return new Response(null,{status:413});}
 const action=String(f.get('action')??''),orgRaw=String(f.get('organization_id')??''),org=orgRaw||null;
 if(org&&!isUuid(org))return new Response(null,{status:400});
 const admin=createAdminSupabase();let error;
 if(action==='submit'){
  const activity=findTrainingActivity(String(f.get('activity')??'')),id=f.get('request_id');
  if(!activity||!isUuid(id))return new Response(null,{status:400});
  if(activity.route==='customer_success'&&!hasCustomerSuccessCourse(session.profile))return new Response(null,{status:403});
  const {data:catalog,error:catalogError}=await session.supabase.from('learning_activity_catalog').select('id').eq('content_key',activity.key).eq('active',true).single();
  if(catalogError||!catalog)return new Response(null,{status:409});
  const answers=activity.decisions.map((_,i)=>{const v=f.get('decision_'+i);return typeof v==='string'&&/^[0-9]$/.test(v)?Number(v):NaN;});
  try{if(answers.length)gradeTrainingDecisions(activity,answers);}catch{return new Response(null,{status:400});}
  if(activity.kind!=='exercise'&&activity.competencies.some(k=>!f.has('score_'+k)))return new Response(null,{status:400});
  const scores=Object.fromEntries(activity.competencies.map(k=>[k,Number(f.get('score_'+k))]));
  if(activity.kind==='exercise')for(const k of activity.competencies)scores[k]=1;
  if(!validScores(scores))return new Response(null,{status:400});
  const draft=String(f.get('draft')??'').trim(),assistance=activity.kind==='exercise'?'recognition':String(f.get('assistance'));
  const reevaluation=String(f.get('reevaluation_of')??'')||null;
  if((activity.reevaluationOf&&!isUuid(reevaluation))||(!activity.reevaluationOf&&reevaluation)||draft.length>24000||!['recognition','guided','independent'].includes(assistance))return new Response(null,{status:400});
  if(reevaluation){const {data:base}=await session.supabase.from('learning_evidence_history').select('activity_key').eq('id',reevaluation).eq('user_id',session.user.id).single();if(base?.activity_key!==activity.reevaluationOf)return new Response(null,{status:400});}
  ({error}=await admin.rpc('submit_training_practice',{p_actor:session.user.id,p_activity:catalog.id,p_request:id,p_org:org,p_draft:draft,p_scores:scores,p_assistance:assistance,p_answers:answers,
   p_auto_results:answers.map((v,i)=>v===activity.decisions[i].correct?1:0),p_reevaluation:reevaluation}));
 }else if(action==='diploma'){
  ({error}=await admin.rpc('issue_training_route_diploma',{p_user:session.user.id,p_org:org}));
 }else if(action==='position'){
  const target=String(f.get('user_id')??session.user.id);
  if(!isUuid(target))return new Response(null,{status:400});
  ({error}=await admin.rpc('set_training_position',{p_actor:session.user.id,p_user:target,p_org:org,p_position:String(f.get('position'))}));
 }else if(action==='reinforce'){
  const target=String(f.get('user_id')??''),date=String(f.get('due_at')??''),keys=f.getAll('units').map(String);
  if(!org||!isUuid(target)||keys.length<1||keys.length>3||new Set(keys).size!==keys.length||!/^\d{4}-\d{2}-\d{2}$/.test(date))return new Response(null,{status:400});
  const p=await trainingPerson(target,org);if(!p)return new Response(null,{status:403});
  const {data:catalog,error:catalogError}=await session.supabase.from('learning_activity_catalog').select('id,content_key').in('content_key',keys).eq('active',true);
  if(catalogError||catalog?.length!==keys.length)return new Response(null,{status:400});
  const before={observed_at:new Date().toISOString(),profile_version:p.profile?.version??null,competencies:p.summary.competencies.map(c=>({key:c.key,level:c.level,count:c.count}))};
  ({error}=await admin.rpc('assign_training_reinforcement',{p_org:org,p_actor:session.user.id,p_user:target,p_activities:catalog.map(a=>a.id),p_due:date+'T23:59:59-06:00',p_before:before}));
 }else if(action==='profile'){
  const weights=Object.fromEntries(Object.keys(COMPETENCIES).map(k=>[k,String(f.get('weight_'+k))]));
  const expected=Object.fromEntries(Object.keys(COMPETENCIES).map(k=>[k,Number(f.get('expected_'+k))]));
  ({error}=await admin.rpc('save_training_job_profile',{p_actor:session.user.id,p_position:String(f.get('position')),p_version:Number(f.get('version')),p_weights:weights,p_expected:expected}));
 }else return new Response(null,{status:400});
 if(error&&['INSUFFICIENT_REVIEWERS','FLOW_PRIORITY_CONFLICT'].some(code=>error.message?.includes(code)))return Response.json({error:'APPROVAL_CONFIG_BLOCKED',detail:'Tu manager debe ajustar la prioridad del flujo o el mínimo de revisores disponibles antes de enviar.'},{status:409});
 if(error)return Response.json({error:'TRAINING_SAVE_FAILED',detail:'Revisa permisos, fecha, rúbrica o conflicto de versión.'},{status:409});
 const destination=action==='reinforce'?`/teams/${org}/person/${String(f.get('user_id'))}`:'/role-training';
 return Response.redirect(new URL(destination+'?result='+(action==='diploma'?'diploma':'saved')+(destination==='/role-training'&&org?'&organization_id='+org:''),req.url),303);
}
