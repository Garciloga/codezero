import {workspaceUser} from '../../../lib/workspace-server';
import {createAdminSupabase} from '../../../lib/admin';
import {boundedForm} from '../../../lib/bounded-form';
import {isUuid,trustedWorkspaceMutation} from '../../../lib/workspace-sandbox';
import {consumeRateLimit} from '../../../lib/rate-limit';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return new Response(null,{status:403});
 const session=await workspaceUser();if(!session||!session.user.email_confirmed_at)return new Response(null,{status:401});
 const rate=await consumeRateLimit('community:'+session.user.id,20,600);if(!rate.allowed)return new Response(null,{status:429});
 let form:FormData;try{form=await boundedForm(req,12000);}catch{return new Response(null,{status:400});}
 const action=String(form.get('action')??''),target=form.get('target'),parent=form.get('parent'),request=form.get('request_id');
 if(!['join','leave','post','remove','report','approve','hide','lock','block','resolve','unblock'].includes(action)||target&&!isUuid(target)||parent&&!isUuid(parent)||action==='post'&&!isUuid(request))return new Response(null,{status:400});
 const result=await createAdminSupabase().rpc('community_action',{p_actor:session.user.id,p_action:action,p_target:target||null,p_parent:parent||null,p_request:request||null,p_title:String(form.get('title')??''),p_body:String(form.get('body')??''),p_alias:String(form.get('alias')??''),p_category:String(form.get('category')??'help'),p_consent:form.get('consent')==='1'});
 const moderation=['approve','hide','lock','block','resolve','unblock'].includes(action);
 const path=moderation?'/admin/social':isUuid(parent)?'/community/'+parent:'/community';
 return Response.redirect(new URL(path+'?result='+(result.error?'failed':action==='post'?'pending':'saved'),process.env.NEXT_PUBLIC_APP_URL??req.url),303);
}
