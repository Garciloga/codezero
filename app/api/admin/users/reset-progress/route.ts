import {createAdminSupabase,requireOwner} from '../../../../../lib/admin';
import {getServerUser} from '../../../../../lib/supabase-server';
import {isTrustedBrowserRequest} from '../../../../../lib/security';
import {boundedForm} from '../../../../../lib/bounded-form';
import {consumeRateLimit} from '../../../../../lib/rate-limit';
import {isUuid} from '../../../../../lib/workspace-sandbox';
import {isLearningResetScope,LEARNING_RESET_FEE_CENTS,LEARNING_RESET_CURRENCY} from '../../../../../lib/learning-reset';
// Irreversible, owner only. The database function re-checks the owner, the confirmation
// email and the scope inside one transaction, and never touches certificates or diplomas.
export async function POST(req:Request){
 if(!isTrustedBrowserRequest(req))return new Response(null,{status:403});
 const {data:{user}}=await getServerUser();if(!user)return new Response(null,{status:401});
 try{await requireOwner(user.id);}catch{return new Response(null,{status:403});}
 const rate=await consumeRateLimit('owner-reset:'+user.id,10,600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 const form=await boundedForm(req,4096).catch(()=>null);if(!form)return new Response(null,{status:413});
 const target=String(form.get('user_id')??''),scope=form.get('scope'),request=String(form.get('request_id')??'');
 if(!isUuid(target)||target===user.id)return Response.json({error:'INVALID_TARGET'},{status:400});
 if(!isLearningResetScope(scope)||!isUuid(request))return Response.json({error:'INVALID_SCOPE'},{status:400});
 if(form.get('fee_confirmed')!=='1')return Response.json({error:'FEE_NOT_CONFIRMED'},{status:400});
 const {data,error}=await createAdminSupabase().rpc('owner_reset_learning',{p_actor:user.id,p_target:target,p_email:String(form.get('confirm_email')??'').trim().toLowerCase(),p_scope:scope,p_request:request,p_reference:String(form.get('payment_reference')??'')});
 if(error){const code=['FORBIDDEN','INVALID_TARGET','EMAIL_MISMATCH','INVALID_SCOPE'].find(x=>error.message.includes(x));return Response.json({error:code??'RESET_FAILED'},{status:code==='FORBIDDEN'?403:409});}
 return Response.json({reset:true,scope,removed:data,fee_cents:LEARNING_RESET_FEE_CENTS,currency:LEARNING_RESET_CURRENCY});
}
