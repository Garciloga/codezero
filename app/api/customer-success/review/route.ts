import {boundedForm} from "../../../../lib/bounded-form";
import {workspaceUser} from '../../../../lib/workspace-server';
import {workspaceEnabled,trustedWorkspaceMutation,isUuid} from '../../../../lib/workspace-sandbox';
import {createAdminSupabase,requireAdmin} from '../../../../lib/admin';
import {consumeRateLimit} from '../../../../lib/rate-limit';
export async function POST(req:Request){if(!workspaceEnabled())return new Response(null,{status:404});if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});const session=await workspaceUser();if(!session)return new Response(null,{status:401});try{await requireAdmin(session.user.id);}catch{return new Response(null,{status:403});}
 const rate=await consumeRateLimit('cs-review:'+session.user.id,30,600);if(!rate.allowed)return new Response(null,{status:429});let f:FormData;try{f=await boundedForm(req,20000);}catch{return new Response(null,{status:413});}const id=f.get('project_id'),feedback=String(f.get('feedback')??'').trim();const scores=Array.from({length:4},(_,i)=>{const x=f.get('criterion_'+i);return typeof x==='string'&&/^\d{1,2}$/.test(x)?Number(x):NaN;});
 if(!isUuid(id)||feedback.length<80||feedback.length>4000||scores.some(x=>!Number.isInteger(x)||x<0||x>25))return Response.json({error:'INVALID_REVIEW'},{status:400});
 const {error}=await createAdminSupabase().rpc('review_cs_course_project',{p_actor:session.user.id,p_id:id,p_score:scores.reduce((a,b)=>a+b,0),p_feedback:feedback,p_rubric:scores});if(error)return Response.json({error:'REVIEW_FAILED'},{status:409});return Response.redirect(new URL('/customer-success/review',req.url),303);
}
