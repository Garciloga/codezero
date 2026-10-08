import {createAdminSupabase,requireOwner} from '../../../../../lib/admin';
import {getServerUser} from '../../../../../lib/supabase-server';
import {isTrustedBrowserRequest} from '../../../../../lib/security';
import {boundedForm} from '../../../../../lib/bounded-form';
import {consumeRateLimit} from '../../../../../lib/rate-limit';
import {isUuid} from '../../../../../lib/workspace-sandbox';
export async function POST(req:Request){
 if(!isTrustedBrowserRequest(req))return new Response(null,{status:403});
 const {data:{user}}=await getServerUser();if(!user)return new Response(null,{status:401});
 try{await requireOwner(user.id);}catch{return new Response(null,{status:403});}
 const rate=await consumeRateLimit('owner-delete:'+user.id,10,600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 const form=await boundedForm(req,4096),target=String(form.get('user_id')??'');if(!isUuid(target)||target===user.id)return Response.json({error:'INVALID_TARGET'},{status:400});
 const admin=createAdminSupabase();
 const {error}=await admin.rpc('owner_archive_user',{p_actor:user.id,p_target:target,p_email:String(form.get('confirm_email')??'').trim().toLowerCase()});
 if(error){const code=['ACTIVE_BILLING','COMPANY_OWNER','INVALID_TARGET','EMAIL_MISMATCH'].find(x=>error.message.includes(x));return Response.json({error:code??'DELETE_FAILED'},{status:409});}
 // The transaction already revoked sessions, banned auth and removed access.
 // Auth soft deletion preserves foreign keys used by audit/billing history.
 const {error:authError}=await admin.auth.admin.deleteUser(target,true);
 return Response.json({deleted:true,authArchived:!authError});
}
