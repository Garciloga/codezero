import {randomUUID} from 'node:crypto';
import {workspaceUser} from '../../../../lib/workspace-server';
import {createAdminSupabase} from '../../../../lib/admin';
import {boundedForm} from '../../../../lib/bounded-form';
import {consumeRateLimit} from '../../../../lib/rate-limit';
import {isUuid,trustedWorkspaceMutation} from '../../../../lib/workspace-sandbox';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return new Response(null,{status:403});
 const session=await workspaceUser();if(!session)return new Response(null,{status:401});
 const rate=await consumeRateLimit('company-message:'+session.user.id,30,60);if(!rate.allowed)return new Response(null,{status:429});
 let form:FormData;try{form=await boundedForm(req,16000);}catch{return new Response(null,{status:413});}
 const org=String(form.get('organization_id')),team=String(form.get('team_id')??'')||null,action=String(form.get('action')??'send');
 if(!isUuid(org)||team&&!isUuid(team))return new Response(null,{status:400});
 const admin=createAdminSupabase();let result;
 if(action==='remove'){const id=form.get('message_id');if(!isUuid(id))return new Response(null,{status:400});result=await admin.rpc('remove_company_message',{p_org:org,p_actor:session.user.id,p_id:id});}
 else if(action==='send'){const request=form.get('request_id');if(!isUuid(request))return new Response(null,{status:400});result=await admin.rpc('send_company_message',{p_org:org,p_actor:session.user.id,p_team:team,p_request:request,p_body:String(form.get('body')??'')});}
 else return new Response(null,{status:400});
 return Response.redirect(new URL(`/teams/${org}/messages?result=${result.error?'failed':'saved'}${team?'&team='+team:''}`,process.env.NEXT_PUBLIC_APP_URL??req.url),303);
}
