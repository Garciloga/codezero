import {boundedForm} from '../../../../lib/bounded-form';
import {roleTrainingEnabled,roleTrainingSession} from '../../../../lib/role-training-server';
import {trustedWorkspaceMutation,isUuid} from '../../../../lib/workspace-sandbox';
import {createAdminSupabase} from '../../../../lib/admin';
import {validReviewSelector,validReviewStages} from '../../../../lib/project-review-flow';
import {consumeRateLimit} from '../../../../lib/rate-limit';
export async function POST(req:Request){
 if(!roleTrainingEnabled())return new Response(null,{status:404});if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});
 const session=await roleTrainingSession();if(!session)return new Response(null,{status:401});
 if(!(await consumeRateLimit('project-flow:'+session.user.id,20,600)).allowed)return new Response(null,{status:429});
 let f:FormData;try{f=await boundedForm(req,100000);}catch{return new Response(null,{status:413});}
 const org=f.get('organization_id'),key=String(f.get('flow_key')??'')||null,version=Number(f.get('version')),priority=Number(f.get('priority')),name=String(f.get('name')??''),enabled=f.get('enabled');
 let audience:unknown,stages:unknown;try{audience=JSON.parse(String(f.get('audience')));stages=JSON.parse(String(f.get('stages')));}catch{return new Response(null,{status:400});}
 if(!isUuid(org)||key&&!isUuid(key)||!Number.isInteger(version)||version<0||!Number.isInteger(priority)||priority<1||priority>1000||name.trim().length<3||name.length>120||!['true','false'].includes(String(enabled))||!validReviewSelector(audience)||!validReviewStages(stages))return new Response(null,{status:400});
 const {error}=await createAdminSupabase().rpc('save_project_review_flow',{p_actor:session.user.id,p_org:org,p_key:key,p_version:version,p_name:name,p_enabled:enabled==='true',p_priority:priority,p_audience:audience,p_stages:stages});
 if(error)return Response.json({error:'FLOW_NOT_SAVED',detail:'Revisa permisos, participantes y versión de la configuración.'},{status:409});
 return Response.redirect(new URL(`/role-training/approval-flow?organization_id=${org}&saved=1`,req.url),303);
}
