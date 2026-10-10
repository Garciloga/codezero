import {createAdminSupabase,requireOwner} from "../../../../lib/admin";
import {getServerUser} from "../../../../lib/supabase-server";
import {isTrustedBrowserRequest} from "../../../../lib/security";
import {consumeRateLimit} from "../../../../lib/rate-limit";
import {boundedForm} from "../../../../lib/bounded-form";
import {isUuid} from "../../../../lib/workspace-sandbox";

/** Separate from the fee-bearing reset of OTHER learners.
 * Only the authenticated owner can reset their own PERSONAL academic history. */
export async function POST(req:Request){
 if(!isTrustedBrowserRequest(req))return Response.json({error:"ORIGIN_FORBIDDEN"},{status:403});
 const {data:{user}}=await getServerUser();
 if(!user)return Response.json({error:"UNAUTHENTICATED"},{status:401});
 try{await requireOwner(user.id);}catch{return Response.json({error:"OWNER_ONLY"},{status:403});}
 const limit=await consumeRateLimit("owner-self-learning-reset:"+user.id,5,600);
 if(!limit.allowed)return Response.json({error:"RATE_LIMITED"},{status:429});
 const form=await boundedForm(req,4096).catch(()=>null);
 if(!form)return Response.json({error:"INVALID_FORM"},{status:400});
 const confirmEmail=String(form.get("confirm_email")??"").trim().toLowerCase();
 const phrase=String(form.get("confirm_phrase")??"");
 const requestId=String(form.get("request_id")??"");
 if(form.get("understood")!=="1"||phrase!=="REINICIAR MI PROGRESO"||!isUuid(requestId)||
  confirmEmail.length<3||confirmEmail.length>254) return Response.json({error:"INVALID_CONFIRMATION"},{status:400});
 const {data,error}=await createAdminSupabase().rpc("owner_reset_own_learning",{
  p_actor:user.id,p_email:confirmEmail,p_phrase:phrase,p_request:requestId
 });
 if(error){
  const code=["EMAIL_MISMATCH","INVALID_CONFIRMATION","OWNER_ONLY","REQUEST_CONFLICT"].find(k=>error.message.includes(k));
  return Response.json({error:code??"RESET_FAILED"},{status:code==="OWNER_ONLY"?403:409});
 }
 return Response.json({reset:true,personal_progress_removed:data,fee_cents:0,preserved:{
  auth:true,owner_role:true,billing:true,organizations:true,company_evidence:true,certificates:true
 }},{headers:{"Cache-Control":"no-store"}});
}
