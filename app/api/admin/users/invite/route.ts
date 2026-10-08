import {createAdminSupabase,requireOwner} from '../../../../../lib/admin';
import {getServerUser} from '../../../../../lib/supabase-server';
import {isTrustedBrowserRequest} from '../../../../../lib/security';
import {consumeRateLimit} from '../../../../../lib/rate-limit';
import {boundedForm} from '../../../../../lib/bounded-form';
import {isUuid} from '../../../../../lib/workspace-sandbox';
export async function POST(req:Request){
 if(!isTrustedBrowserRequest(req))return new Response(null,{status:403});
 const {data:{user}}=await getServerUser();if(!user)return new Response(null,{status:401});
 try{await requireOwner(user.id);}catch{return new Response(null,{status:403});}
 const rate=await consumeRateLimit('owner-invite:'+user.id,10,3600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 const form=await boundedForm(req,4096),id=String(form.get('user_id')??'');if(!isUuid(id)||id===user.id)return new Response(null,{status:400});
 const admin=createAdminSupabase();const {data:profile}=await admin.from('profiles').select('email,role,status,deleted_at').eq('id',id).single();
 if(!profile||profile.role==='owner'||profile.status!=='active'||profile.deleted_at)return Response.json({error:'ACCOUNT_UNAVAILABLE'},{status:409});
 const {error:auditError}=await admin.from('admin_audit_log').insert({actor_user_id:user.id,action:'user_invitation_requested',target_type:'profile',target_id:id});
 if(auditError)return new Response(null,{status:500});
 const {error}=await admin.auth.signInWithOtp({email:profile.email,options:{shouldCreateUser:false,emailRedirectTo:new URL('/reset-password',process.env.NEXT_PUBLIC_APP_URL!).toString()}});
 return Response.json(error?{error:'INVITATION_FAILED'}:{invitationSent:true},{status:error?409:200});
}
