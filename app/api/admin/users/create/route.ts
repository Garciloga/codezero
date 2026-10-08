import {randomBytes} from 'node:crypto';
import {createAdminSupabase,requireOwner} from '../../../../../lib/admin';
import {getServerUser} from '../../../../../lib/supabase-server';
import {trustedWorkspaceMutation,validInvitationEmail} from '../../../../../lib/workspace-sandbox';
import {boundedForm} from '../../../../../lib/bounded-form';
import {consumeRateLimit} from '../../../../../lib/rate-limit';
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return Response.json({error:'FORBIDDEN'},{status:403});
 const {data:{user}}=await getServerUser();if(!user)return Response.json({error:'UNAUTHENTICATED'},{status:401});
 try{await requireOwner(user.id);}catch{return Response.json({error:'FORBIDDEN'},{status:403});}
 const rate=await consumeRateLimit('owner-user-create:'+user.id,10,3600);if(!rate.allowed)return Response.json({error:'RATE_LIMITED'},{status:429});
 let form:FormData;try{form=await boundedForm(req,4096);}catch{return Response.json({error:'INVALID_REQUEST'},{status:400});}
 const email=String(form.get('email')??'').trim().toLowerCase(),name=String(form.get('full_name')??'').trim(),plan=String(form.get('plan_name')??'');
 if(!validInvitationEmail(email)||name.length<2||name.length>100||!['free','starter','pro','enterprise'].includes(plan))return Response.json({error:'INVALID_REQUEST'},{status:400});
 const admin=createAdminSupabase();
 const {data:existing,error:lookupError}=await admin.from('profiles').select('id').ilike('email',email).maybeSingle();
 if(lookupError)return Response.json({error:'CREATE_FAILED'},{status:500});
 if(existing)return Response.json({error:'USER_EXISTS'},{status:409});
 // Generate a one-use email-verification/setup link. It is shown only to the
 // authorized owner, never stored in an audit log or sent automatically.
 const {data,error}=await admin.auth.admin.generateLink({type:'signup',email,password:randomBytes(32).toString('base64url'),options:{data:{full_name:name},redirectTo:new URL('/reset-password',process.env.NEXT_PUBLIC_APP_URL!).toString()}});
 if(error||!data?.user)return Response.json({error:'CREATE_FAILED'},{status:409});
 const {error:grantError}=await admin.rpc('owner_grant_user_access',{p_actor:user.id,p_target:data.user.id,p_name:name,p_plan:plan});
 if(grantError)return Response.json({error:'ACCESS_PENDING'},{status:500});
 return Response.json({created:true,setupUrl:new URL('/api/auth/activate?token_hash='+encodeURIComponent(data.properties.hashed_token),process.env.NEXT_PUBLIC_APP_URL!).toString()},{headers:{'Cache-Control':'private, no-store'}});
}
