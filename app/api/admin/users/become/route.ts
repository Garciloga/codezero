import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {createAdminSupabase,requireOwner} from '../../../../../lib/admin';
import {createServerSupabase} from '../../../../../lib/supabase-server';
import {isTrustedBrowserRequest} from '../../../../../lib/security';
import {consumeRateLimit} from '../../../../../lib/rate-limit';
import {boundedForm} from '../../../../../lib/bounded-form';
import {isUuid} from '../../../../../lib/workspace-sandbox';
import {SUPPORT_COOKIE,SUPPORT_DURATION,sealSupport} from '../../../../../lib/support-session-crypto.mjs';
export async function POST(req:Request){
 if(!isTrustedBrowserRequest(req))return new Response(null,{status:403});
 const jar=await cookies();if(jar.has(SUPPORT_COOKIE))return NextResponse.redirect(new URL('/support-return',req.url),303);
 const client=await createServerSupabase();const {data:{user}}=await client.auth.getUser();
 if(!user)return new Response(null,{status:401});
 try{await requireOwner(user.id);}catch{return new Response(null,{status:403});}
 const rate=await consumeRateLimit('owner-become:'+user.id,20,600);if(!rate.allowed)return new Response(null,{status:429});
 const form=await boundedForm(req,4096);const target=String(form.get('user_id')??'');
 if(!isUuid(target)||target===user.id)return new Response(null,{status:400});
 const admin=createAdminSupabase();const {data:profile}=await admin.from('profiles').select('role,status,deleted_at').eq('id',target).single();
 const {data:account}=await admin.auth.admin.getUserById(target);
 if(!profile||profile.role==='owner'||profile.status!=='active'||profile.deleted_at||!account.user?.email_confirmed_at||!account.user.email)return NextResponse.redirect(new URL('/admin?support=unavailable',req.url),303);
 const {data:{session}}=await client.auth.getSession();if(!session)return new Response(null,{status:401});
 const {error:auditError}=await admin.from('admin_audit_log').insert({actor_user_id:user.id,action:'support_session_started',target_type:'profile',target_id:target,metadata:{minutes:20,read_only:true}});
 if(auditError)return new Response(null,{status:500});
 const {data:link,error}=await admin.auth.admin.generateLink({type:'magiclink',email:account.user.email});
 if(error||!link.properties)return new Response(null,{status:500});
 const sealed=sealSupport({owner:user.id,target,refresh:session.refresh_token,expires:Date.now()+SUPPORT_DURATION},process.env.SUPABASE_SECRET_KEY);
 const {data:switchData,error:switchError}=await client.auth.verifyOtp({type:'magiclink',token_hash:link.properties.hashed_token});
 if(switchError||switchData.user?.id!==target||!switchData.session)return new Response(null,{status:500});
 const sessionId=JSON.parse(Buffer.from(switchData.session.access_token.split('.')[1],'base64url').toString()).session_id;
 const {error:recordError}=await admin.from('owner_support_sessions').insert({session_id:sessionId,owner_id:user.id,target_id:target,expires_at:new Date(Date.now()+SUPPORT_DURATION).toISOString()});
 if(recordError){await client.auth.signOut({scope:'local'});await client.auth.refreshSession({refresh_token:session.refresh_token});return new Response(null,{status:500});}
 jar.set(SUPPORT_COOKIE,sealed,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:8*3600});
 return NextResponse.redirect(new URL('/dashboard',req.url),303);
}
