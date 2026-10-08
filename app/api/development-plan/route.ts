import {roleTrainingSession,trainingPerson} from '../../../lib/role-training-server';
import {boundedForm} from '../../../lib/bounded-form';
import {trustedWorkspaceMutation,isUuid} from '../../../lib/workspace-sandbox';
import {COMPETENCIES,type CompetencyKey} from '../../../lib/competency-matrix';
import {findTrainingActivity} from '../../../lib/role-training-content';
import {validDevelopmentGoals} from '../../../lib/development-plan';
import {createAdminSupabase} from '../../../lib/admin';
import {consumeRateLimit} from '../../../lib/rate-limit';
import {supportSession} from '../../../lib/support-session';
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(!trustedWorkspaceMutation(req)||await supportSession())return new Response(null,{status:403,headers});const s=await roleTrainingSession();if(!s)return new Response(null,{status:401,headers});if(!(await consumeRateLimit('development-plan:'+s.user.id,20,600)).allowed)return new Response(null,{status:429,headers});
 let f:FormData;try{f=await boundedForm(req,12000);}catch{return new Response(null,{status:413,headers});}const action=String(f.get('action')),id=String(f.get('plan_id'));if(!isUuid(id))return new Response(null,{status:400,headers});let result,destination='/dashboard?view=learning';
 if(action==='propose'){
  const org=String(f.get('organization_id')),user=String(f.get('user_id')),date=String(f.get('due_at'));if(!isUuid(org)||!isUuid(user)||!/^\d{4}-\d{2}-\d{2}$/.test(date))return new Response(null,{status:400,headers});const p=await trainingPerson(user,org);if(!p)return new Response(null,{status:403,headers});
  const goals=[0,1,2].flatMap(i=>{const key=String(f.get('key_'+i));return key?[{key:key as CompetencyKey,target:Number(f.get('target_'+i)),baseline:p.summary.competencies.find(c=>c.key===key)?.level??0,activity:String(f.get('activity_'+i))}]:[];});
  if(!validDevelopmentGoals(goals)||goals.some(g=>!findTrainingActivity(g.activity)?.competencies.includes(g.key)))return new Response(null,{status:400,headers});
  const before={observed_at:new Date().toISOString(),profile_version:p.profile?.version??null,competencies:p.summary.competencies.map(c=>({key:c.key,level:c.level,count:c.count}))};
  result=await createAdminSupabase().rpc('propose_learning_development_plan',{p_actor:s.user.id,p_org:org,p_user:user,p_id:id,p_goals:goals,p_due:date+'T23:59:59-06:00',p_before:before});destination=`/teams/${org}/person/${user}`;
 }else if(['accept','comment'].includes(action)){const revision=Number(f.get('revision')),comment=String(f.get('comment')??'').trim();if(!Number.isInteger(revision)||revision<1||comment.length>2000||action==='comment'&&!comment)return new Response(null,{status:400,headers});result=await createAdminSupabase().rpc('respond_learning_development_plan',{p_actor:s.user.id,p_id:id,p_revision:revision,p_action:action,p_comment:comment});}
 else return new Response(null,{status:400,headers});if(result.error)return Response.json({error:'PLAN_SAVE_FAILED'},{status:409,headers});return Response.redirect(new URL(destination,req.url),303);
}
