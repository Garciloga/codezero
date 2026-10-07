import {randomBytes} from 'node:crypto';
import {workspaceUser} from '../../../../lib/workspace-server';
import {trustedWorkspaceMutation,workspaceEnabled,isUuid} from '../../../../lib/workspace-sandbox';
import {createAdminSupabase} from '../../../../lib/admin';
import {consumeRateLimit} from '../../../../lib/rate-limit';
export async function POST(req:Request){
 if(!workspaceEnabled())return new Response(null,{status:404});
 if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});
 const session=await workspaceUser();if(!session)return Response.json({error:'UNAUTHENTICATED'},{status:401});
 const rate=await consumeRateLimit('certificate-share:'+session.user.id,10,600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 let body;try{body=await req.json();}catch{return Response.json({error:'INVALID_REQUEST'},{status:400});}
 if(!body||!isUuid(body.certificateId)||typeof body.enabled!=='boolean'||(body.enabled&&body.consent!==true))return Response.json({error:'CONSENT_REQUIRED'},{status:400});
 const {data,error}=await createAdminSupabase().rpc('publish_awarded_certificate',{p_user:session.user.id,p_certificate:body.certificateId,p_token:randomBytes(32).toString('hex'),p_enabled:body.enabled});
 if(error)return Response.json({error:'CERTIFICATE_UNAVAILABLE'},{status:409});
 return Response.json({path:data?'/verify/'+data:null});
}
