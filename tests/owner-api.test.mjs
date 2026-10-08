import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const owner='00000000-0000-4000-8000-000000000001',target='00000000-0000-4000-8000-000000000002';
function load(path,mocks){const compiled=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const out={exports:{}};new Function('require','module','exports',compiled)(name=>{if(!(name in mocks))throw Error('Missing mock '+name);return mocks[name];},out,out.exports);return out.exports;}
function req(fields){const form=new FormData();for(const [k,v]of Object.entries(fields))form.set(k,v);return new Request('https://app.example.test/api/admin/users/create',{method:'POST',headers:{origin:'https://app.example.test'},body:form});}
const rate={consumeRateLimit:async()=>({allowed:true})},bounded={boundedForm:r=>r.formData()},security={trustedWorkspaceMutation:()=>true,validInvitationEmail:v=>v.includes('@')};
test('owner creation chooses exactly one invitation path and does not send when unchecked',async()=>{
 process.env.NEXT_PUBLIC_APP_URL='https://app.example.test';let sent=0,links=0,grants=0;
 const admin={from:()=>({select:()=>({ilike:()=>({maybeSingle:async()=>({data:null})})})}),auth:{admin:{inviteUserByEmail:async()=>{sent++;return{data:{user:{id:target}},error:null};},generateLink:async()=>{links++;return{data:{user:{id:target},properties:{hashed_token:'a'.repeat(64)}},error:null};}}},rpc:async()=>{grants++;return{error:null};}};
 const mocks={'node:crypto':{randomBytes:()=>({toString:()=> 'random-password'})},'../../../../../lib/admin':{createAdminSupabase:()=>admin,requireOwner:async()=>{}},'../../../../../lib/supabase-server':{getServerUser:async()=>({data:{user:{id:owner}}})},'../../../../../lib/workspace-sandbox':security,'../../../../../lib/bounded-form':bounded,'../../../../../lib/rate-limit':rate};
 const route=load('app/api/admin/users/create/route.ts',mocks),base={email:'learner@example.test',full_name:'Test Learner',plan_name:'pro'};
 const manual=await (await route.POST(req(base))).json();assert.equal(manual.invitationSent,false);assert.match(manual.setupUrl,/token_hash=/);assert.equal(sent,0);
 const email=await (await route.POST(req({...base,send_invitation:'1'}))).json();assert.equal(email.invitationSent,true);assert.equal(email.setupUrl,null);assert.equal(sent,1);assert.equal(links,1);assert.equal(grants,2);
 mocks['../../../../../lib/admin'].requireOwner=async()=>{throw Error('FORBIDDEN');};assert.equal((await route.POST(req(base))).status,403);assert.equal(grants,2);
});
test('owner deletion cannot run without owner role or archive authorization',async()=>{
 let deleted=0,rpcs=0;const admin={rpc:async()=>{rpcs++;return{error:{message:'ACTIVE_BILLING'}};},auth:{admin:{deleteUser:async()=>{deleted++;return{error:null};}}}};
 const mocks={'../../../../../lib/admin':{createAdminSupabase:()=>admin,requireOwner:async()=>{}},'../../../../../lib/supabase-server':{getServerUser:async()=>({data:{user:{id:owner}}})},'../../../../../lib/security':{isTrustedBrowserRequest:()=>true},'../../../../../lib/bounded-form':bounded,'../../../../../lib/rate-limit':rate,'../../../../../lib/workspace-sandbox':{isUuid:()=>true}};
 const route=load('app/api/admin/users/delete/route.ts',mocks);
 assert.equal((await route.POST(req({user_id:owner,confirm_email:'owner@example.test'}))).status,400);assert.equal(rpcs,0);
 assert.equal((await route.POST(req({user_id:target,confirm_email:'learner@example.test'}))).status,409);assert.equal(deleted,0);
 mocks['../../../../../lib/admin'].requireOwner=async()=>{throw Error();};assert.equal((await route.POST(req({user_id:target}))).status,403);assert.equal(rpcs,1);
});
test('become requires owner authorization and records only a short support session',async()=>{
 process.env.SUPABASE_SECRET_KEY='test-server-secret';let audited=0,generated=0,registered=0;const jar=new Map();
 const next={NextResponse:{redirect:(url,status=307)=>new Response(null,{status,headers:{location:String(url)}})}};
 const client={auth:{getUser:async()=>({data:{user:{id:owner}}}),getSession:async()=>({data:{session:{refresh_token:'original-private-refresh'}}}),verifyOtp:async()=>({data:{user:{id:target},session:{access_token:'head.'+Buffer.from(JSON.stringify({session_id:target})).toString('base64url')+'.signature'}},error:null})}};
 const admin={from:table=>({select:()=>({eq:()=>({single:async()=>({data:{role:'student',status:'active',deleted_at:null}})})}),insert:async()=>{if(table==='admin_audit_log')audited++;else registered++;return{error:null};}}),auth:{admin:{getUserById:async()=>({data:{user:{id:target,email:'learner@example.test',email_confirmed_at:new Date().toISOString()}}}),generateLink:async()=>{generated++;return{data:{properties:{hashed_token:'never-exposed'}},error:null};}}}};
 const crypto=await import('../lib/support-session-crypto.mjs');
 const mocks={'next/headers':{cookies:async()=>({has:k=>jar.has(k),set:(k,v)=>jar.set(k,v)})},'next/server':next,'../../../../../lib/admin':{createAdminSupabase:()=>admin,requireOwner:async()=>{throw Error();}},'../../../../../lib/supabase-server':{createServerSupabase:async()=>client},'../../../../../lib/security':{isTrustedBrowserRequest:()=>true},'../../../../../lib/rate-limit':rate,'../../../../../lib/bounded-form':bounded,'../../../../../lib/workspace-sandbox':{isUuid:()=>true},'../../../../../lib/support-session-crypto.mjs':crypto};
 const route=load('app/api/admin/users/become/route.ts',mocks);
 assert.equal((await route.POST(req({user_id:target}))).status,403);assert.equal(generated,0);
 mocks['../../../../../lib/admin'].requireOwner=async()=>{};const response=await route.POST(req({user_id:target}));assert.equal(response.status,303);assert.match(response.headers.get('location'),/dashboard$/);assert.equal(audited,1);assert.equal(registered,1);assert.equal(generated,1);
 const backup=crypto.openSupport(jar.get(crypto.SUPPORT_COOKIE),'test-server-secret');assert.equal(backup.owner,owner);assert.equal(backup.target,target);assert.equal(backup.refresh,'original-private-refresh');assert.ok(backup.expires>Date.now());assert.equal(response.headers.get('location').includes('never-exposed'),false);
 const repeat=await route.POST(req({user_id:target}));assert.equal(repeat.status,303);assert.match(repeat.headers.get('location'),/support-return$/);assert.equal(generated,1);
});
