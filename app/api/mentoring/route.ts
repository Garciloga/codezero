import {workspaceUser} from '../../../lib/workspace-server';
import {createAdminSupabase} from '../../../lib/admin';
import {boundedForm} from '../../../lib/bounded-form';
import {isUuid,trustedWorkspaceMutation} from '../../../lib/workspace-sandbox';
import {consumeRateLimit} from '../../../lib/rate-limit';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return new Response(null,{status:403});
 const s=await workspaceUser();if(!s||!s.user.email_confirmed_at)return new Response(null,{status:401});
 const rate=await consumeRateLimit('mentoring:'+s.user.id,20,600);if(!rate.allowed)return new Response(null,{status:429});
 let form:FormData;try{form=await boundedForm(req,10000);}catch{return new Response(null,{status:400});}
 const action=String(form.get('action')??''),target=form.get('target'),request=form.get('request_id'),start=form.get('starts_at');
 if(!['owner_profile','slot','close_slot','request','cancel','decline','confirm','complete','approve_mentor','pause_mentor'].includes(action)||target&&!isUuid(target)||action==='request'&&!isUuid(request))return new Response(null,{status:400});
 if(['owner_profile','slot','close_slot','decline','confirm','complete','approve_mentor','pause_mentor'].includes(action)&&s.profile.role!=='owner')return new Response(null,{status:403});
 let url=String(form.get('meeting_url')??'');
 if(action==='confirm'){try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)throw Error();url=u.toString();}catch{return new Response(null,{status:400});}}
 const timestamp=start?Date.parse(String(start)+'Z'):NaN;if(action==='slot'&&!Number.isFinite(timestamp))return new Response(null,{status:400});
 const r=await createAdminSupabase().rpc('mentoring_action',{p_actor:s.user.id,p_action:action,p_target:target||null,p_request:request||null,p_name:String(form.get('display_name')??''),p_bio:String(form.get('bio')??''),p_languages:form.getAll('languages').map(String),p_start:action==='slot'?new Date(timestamp).toISOString():null,p_topic:String(form.get('topic')??''),p_reference:String(form.get('payment_reference')??''),p_url:url,p_consent:form.get('consent')==='1'});
 const path=['confirm','approve_mentor','pause_mentor'].includes(action)?'/admin/social':'/mentoring';
 return Response.redirect(new URL(path+'?result='+(r.error?'failed':'saved'),process.env.NEXT_PUBLIC_APP_URL??req.url),303);
}

