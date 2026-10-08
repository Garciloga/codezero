import 'server-only';
import {createAdminSupabase} from './admin';
import {consumeRateLimit} from './rate-limit';
/** Queue acceptance is not proof of inbox delivery. No Auth account is created here. */
export async function deliverCompanyInvitation(invitation:string,actor:string){
 const admin=createAdminSupabase();
 const {data:row,error}=await admin.from('organization_invitations').select('id,email,organization_id,team_id,created_by,expires_at,accepted_at,revoked_at,email_status,email_started_at').eq('id',invitation).single();
 if(error||!row||row.accepted_at||row.revoked_at||Date.parse(row.expires_at)<=Date.now())return 'unavailable';
 const {data:permission,error:permissionError}=await admin.rpc('company_can_invite',{p_org:row.organization_id,p_actor:actor,p_team:row.team_id});if(permissionError||!permission)return 'unavailable';
 if(row.email_status==='queued')return 'queued';
 const {RESEND_API_KEY:providerCredential,CODEZERO_INVITATION_FROM:from}=process.env;
 if(process.env.CODEZERO_INVITATION_EMAIL!=='1'||!providerCredential||!from)return 'prepared';
 let base:URL;try{base=new URL(process.env.NEXT_PUBLIC_APP_URL??'');if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/'||/[\r\n]/.test(from))return 'prepared';}catch{return 'prepared';}
 const rate=await consumeRateLimit('company-invitation-mail:'+actor,3,3600);if(!rate.allowed)return 'prepared';
 const {data:claim,error:claimError}=await admin.rpc('claim_company_invitation_email',{p_invite:invitation,p_actor:actor});if(claimError||!claim)return 'prepared';
 const {data:claimed}=await admin.from('organization_invitations').select('email_attempts').eq('id',invitation).single();if(!claimed)return 'failed';
 const link=new URL('/teams/join?id='+invitation,base).toString();
 // Immutable payload + provider idempotency key permit safe retry after uncertain responses.
 const payload={from,to:[row.email],subject:'Invitación a tu compañía en Garciloga',text:`Te invitaron a una compañía en Garciloga.\n\nAbre ${link} e inicia sesión o regístrate con este correo. Debes verificarlo antes de aceptar.\nLa invitación vence el ${row.expires_at.slice(0,10)}. Si no esperabas esta invitación, puedes ignorarla. Tu contraseña es privada.`};
 let queued=false,providerId:string|null=null;
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+providerCredential,'Content-Type':'application/json','Idempotency-Key':'garciloga-company-invite-'+invitation},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});if(response.ok){const result=await response.json();if(typeof result.id==='string'){queued=true;providerId=result.id;}}}catch{}
 await admin.from('organization_invitations').update({email_status:queued?'queued':'failed',email_provider_id:providerId}).eq('id',invitation).eq('email_status','sending').eq('email_attempts',claimed.email_attempts);
 return queued?'queued':'failed';
}

