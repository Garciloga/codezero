import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {createAdminSupabase,requireOwner} from '../../../../../lib/admin';
import {createServerSupabase} from '../../../../../lib/supabase-server';
import {isTrustedBrowserRequest} from '../../../../../lib/security';
import {supportSession} from '../../../../../lib/support-session';
import {SUPPORT_COOKIE} from '../../../../../lib/support-session-crypto.mjs';
export async function POST(req:Request){
 if(!isTrustedBrowserRequest(req))return new Response(null,{status:403});
 const backup=await supportSession();if(!backup)return new Response(null,{status:400});
 const client=await createServerSupabase();
 const {data:{user}}=await client.auth.getUser();
 const {data:{session}}=await client.auth.getSession();
 if(user?.id===backup.target&&session){const sessionId=JSON.parse(Buffer.from(session.access_token.split('.')[1],'base64url').toString()).session_id;await createAdminSupabase().from('owner_support_sessions').update({ended_at:new Date().toISOString()}).eq('session_id',sessionId).eq('owner_id',backup.owner).eq('target_id',backup.target);}
 // Revoke only the temporary session, never the learner's other sessions.
 if(user?.id===backup.target)await client.auth.signOut({scope:'local'});
 try{await requireOwner(backup.owner);}catch{(await cookies()).delete(SUPPORT_COOKIE);return NextResponse.redirect(new URL('/login',req.url),303);}
 const {data,error}=await client.auth.refreshSession({refresh_token:backup.refresh});
 if(error||data.user?.id!==backup.owner){await client.auth.signOut({scope:'local'});(await cookies()).delete(SUPPORT_COOKIE);return NextResponse.redirect(new URL('/login',req.url),303);}
 const {error:auditError}=await createAdminSupabase().from('admin_audit_log').insert({actor_user_id:backup.owner,action:'support_session_ended',target_type:'profile',target_id:backup.target,metadata:{expired:Date.now()>backup.expires}});
 (await cookies()).delete(SUPPORT_COOKIE);
 return NextResponse.redirect(new URL('/admin'+(auditError?'?support=audit_failed':''),req.url),303);
}
