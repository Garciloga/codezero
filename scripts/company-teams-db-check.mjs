import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let checks=0;
const check = (name,fn) => fn().then(()=>{checks++; console.log('PASS',name);});
async function as(role,user,fn){
 await db.exec(`begin; set local role ${role}; set local "request.jwt.claim.sub"='${user}';`);
 try {const r=await fn();await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}
}
async function rejected(fn){let caught=false;try{await fn();}catch{caught=true;}assert.equal(caught,true);}
try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; grant usage on schema auth to authenticated,service_role;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid primary key references auth.users,role text,status text,full_name text);
 alter table public.profiles enable row level security;
 grant select on public.profiles to authenticated;
 create policy profiles_own on public.profiles for select to authenticated using(id=auth.uid());
 create table public.levels(id bigint primary key,level_number integer unique,title text,status text);
 create table public.lessons(id bigint primary key,level_id bigint,status text,title text);
 create table public.level_exams(id bigint primary key,level_id bigint,status text,title text);
 create table public.level_projects(id bigint primary key,level_id bigint,status text,title text);
 create table public.lesson_progress(user_id uuid,lesson_id bigint,status text);
 create table public.exam_attempts(id bigint generated always as identity,user_id uuid,exam_id bigint,passed boolean,score integer default 80,created_at timestamptz default now());
 create table public.project_submissions(id bigint generated always as identity,user_id uuid,project_id bigint,status text,score integer default 80,updated_at timestamptz default now());
 grant usage on schema public to anon,authenticated,service_role;
 grant select on all tables in schema public to service_role;
 insert into auth.users values ${Array.from({length:8},(_,i)=>`('${id(i+1)}')`).join(',')};
 insert into public.profiles values ${Array.from({length:8},(_,i)=>`('${id(i+1)}','${[0,5].includes(i)?'owner':'student'}','active','Persona ${i+1}')`).join(',')};`);
 const migration=process.env.CODEZERO_DB_CHECK_MIGRATION || readdirSync('supabase/sandbox/migrations').find(f=>f.endsWith('_enterprise_workspace_sandbox.sql'));
 await db.exec(readFileSync((process.env.CODEZERO_DB_CHECK_MIGRATION?'supabase/migrations/':'supabase/sandbox/migrations/')+migration,'utf8'));
 console.log('PostgreSQL', (await db.query('select version()')).rows[0].version);
 const rpc=async(q,params=[])=>as('service_role',id(1),()=>db.query(q,params));

 await db.exec(readFileSync('supabase/migrations/20261007222517_vivo_enterprise_workspace.sql','utf8'));
 await db.exec(`alter table public.profiles add column email text;alter table auth.users add column email text,add column email_confirmed_at timestamptz;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated,service_role;grant select on storage.objects to authenticated;grant all on all tables in schema storage to service_role;`);
 for(let n=1;n<=8;n++){await db.query('update auth.users set email=$1,email_confirmed_at=now() where id=$2',[`persona${n}@codezero.example.test`,id(n)]);await db.query('update public.profiles set email=$1 where id=$2',[`persona${n}@codezero.example.test`,id(n)]);}
 await db.exec(readFileSync('supabase/migrations/20261008062034_company_teams_entitlements.sql','utf8'));
 const provision=(owner,ref,seats)=>rpc("select public.provision_company_contract($1,$2,$3,$4,$5,'enterprise',now()+interval '1 year') id",[id(1),'Compañía '+ref,`persona${owner}@codezero.example.test`,ref,seats]);
 const org=(await provision(2,'contract-A',5)).rows[0].id;
 await db.exec(readFileSync('supabase/migrations/20261008071824_company_contract_indexes.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261008073155_company_active_scope_guards.sql','utf8'));
 const other=(await provision(6,'contract-B',2)).rows[0].id;
 const invite=(actor,email,team=null,role='learner')=>rpc('select public.create_company_invitation($1,$2,$3,$4,null,$5) id',[org,id(actor),email,role,team]);
 const accept=(n,inv)=>rpc('select public.accept_workspace_invitation($1,$2,$3,$4)',[inv,id(n),`persona${n}@codezero.example.test`,`Persona ${n}`]);
 const setup=(team,n,member,view,invites)=>rpc('select public.configure_company_team($1,$2,$3,$4,$5,$6,$7,$8) id',[org,id(2),team,'Equipo '+n,n?id(n):null,member,view,invites]);
 const alpha=(await setup(null,null,false,false,false)).rows[0].id;
 const beta=(await rpc('select public.configure_company_team($1,$2,null,$3,null,false,false,false) id',[org,id(2),'Equipo B'])).rows[0].id;
 await check('operator is not silently enrolled; responsible is the only initial member',async()=>{
 assert.equal((await db.query('select count(*) n from public.organization_memberships where organization_id=$1',[org])).rows[0].n,1);
 assert.equal((await db.query('select user_id from public.organization_memberships where organization_id=$1',[org])).rows[0].user_id,id(2));
 });
 await check('exact capacity includes pending invitations; replay cannot consume another seat',async()=>{
 const a=(await invite(2,'persona3@codezero.example.test',alpha)).rows[0].id;
 assert.equal((await invite(2,'persona3@codezero.example.test',alpha)).rows[0].id,a);
 await accept(3,a);
 const b=(await invite(2,'persona4@codezero.example.test',beta)).rows[0].id;await accept(4,b);
 const c=(await invite(2,'persona5@codezero.example.test')).rows[0].id;await accept(5,c);
 const reservation=(await invite(2,'persona7@codezero.example.test',alpha)).rows[0].id;
 assert.equal((await rpc('select public.company_seat_usage($1) n',[org])).rows[0].n,5);
 await rejected(()=>invite(2,'persona8@codezero.example.test'));
 await rpc('select public.revoke_company_invitation($1,$2,$3)',[org,id(2),reservation]);
 assert.equal((await rpc('select public.company_seat_usage($1) n',[org])).rows[0].n,4);
 });
 await check('reactivation cannot overbook; accepting a reserved invitation converts exactly one seat',async()=>{
 const seven=(await invite(2,'persona7@codezero.example.test')).rows[0].id;
 await db.query('update public.organization_memberships set active=false where organization_id=$1 and user_id=$2',[org,id(3)]);
 const eight=(await invite(2,'persona8@codezero.example.test')).rows[0].id;
 await rejected(()=>rpc('update public.organization_memberships set active=true where organization_id=$1 and user_id=$2',[org,id(3)]));
 await rpc('select public.revoke_company_invitation($1,$2,$3)',[org,id(2),eight]);
 await rpc('update public.organization_memberships set active=true where organization_id=$1 and user_id=$2',[org,id(3)]);
 await accept(7,seven);assert.equal((await rpc('select public.company_seat_usage($1) n',[org])).rows[0].n,5);
 await db.query('update public.organization_memberships set active=false where organization_id=$1 and user_id=$2',[org,id(7)]);
 await rpc('select public.rebuild_organization_access($1)',[org]);
 });
 await check('delegated employee can invite only own permitted team, never elevate roles',async()=>{
 await setup(alpha,3,true,false,true);
 const delegated=(await invite(3,'persona7@codezero.example.test',alpha)).rows[0].id;
 await rejected(()=>invite(3,'persona8@codezero.example.test',beta));
 await rejected(()=>invite(3,'persona8@codezero.example.test',alpha,'admin'));
 await rpc('select public.revoke_company_invitation($1,$2,$3)',[org,id(3),delegated]);
 });
 await check('teams are isolated; explicit viewer can see two teams without reciprocal access',async()=>{
 await setup(alpha,5,false,true,false);await setup(beta,5,false,true,false);
 const targets=async n=>(await as('authenticated',id(n),()=>db.query('select user_id from public.organization_memberships where organization_id=$1 order by user_id',[org]))).rows.map(x=>x.user_id);
 assert.deepEqual(await targets(3),[id(3)]);assert.deepEqual(await targets(4),[id(4)]);assert.deepEqual(await targets(5),[id(3),id(4),id(5)]);
 const directory=(await rpc('select * from public.workspace_directory($1,$2)',[org,id(5)])).rows.map(x=>x.user_id).sort();assert.deepEqual(directory,[id(3),id(4),id(5)]);
 assert.deepEqual(await targets(1),[]);
 await rejected(()=>rpc('select * from public.workspace_directory($1,$2)',[org,id(1)]));
 });
 await check('same user joins a second company; identity and cupo remain company-specific',async()=>{
 const invitation=(await rpc('select public.create_company_invitation($1,$2,$3,$4,null,null) id',[other,id(6),'persona5@codezero.example.test','learner'])).rows[0].id;
 await accept(5,invitation);
 assert.equal((await db.query('select count(*) n from public.organization_memberships where user_id=$1',[id(5)])).rows[0].n,2);
 assert.equal((await rpc('select public.company_seat_usage($1) n',[other])).rows[0].n,2);
 const visible=(await as('authenticated',id(4),()=>db.query('select id from public.organizations'))).rows.map(x=>x.id);assert.deepEqual(visible,[org]);
 });
 await check('contract limits cannot be edited by company owner; reductions cannot eject occupied seats',async()=>{
 await rejected(()=>rpc("select public.set_company_contract($1,$2,'contract-A',100,'enterprise',now()+interval '1 year',true)",[id(2),org]));
 await rejected(()=>rpc("select public.set_company_contract($1,$2,'contract-A',3,'enterprise',now()+interval '1 year',true)",[id(1),org]));
 await rejected(()=>as('authenticated',id(2),()=>db.query('update public.organization_contracts set seat_limit=100 where organization_id=$1',[org])));
 });
 await check('expired contracts reject invitations; revoked grants invalidate pending acceptance',async()=>{
 const pending=(await invite(3,'persona7@codezero.example.test',alpha)).rows[0].id;
 await setup(alpha,3,true,false,false);await rejected(()=>accept(7,pending));
 await rpc('select public.revoke_company_invitation($1,$2,$3)',[org,id(2),pending]);
 await db.query("update public.organization_contracts set valid_until=now()-interval '1 second' where organization_id=$1",[org]);await rejected(()=>invite(2,'persona8@codezero.example.test'));
 await db.query("update public.organization_contracts set valid_until=now()+interval '1 year' where organization_id=$1",[org]);
 });
 await check('mail claims serialize retries and refuse unknown responses beyond the provider idempotency window',async()=>{
 const inv=(await invite(2,'persona7@codezero.example.test',alpha)).rows[0].id;
 const claim=()=>rpc('select public.claim_company_invitation_email($1,$2) ok',[inv,id(2)]);
 assert.equal((await claim()).rows[0].ok,true);assert.equal((await claim()).rows[0].ok,false);
 await db.query("update public.organization_invitations set email_status='failed',email_started_at=now()-interval '61 seconds' where id=$1",[inv]);assert.equal((await claim()).rows[0].ok,true);
 await db.query("update public.organization_invitations set email_status='failed',email_started_at=now()-interval '24 hours' where id=$1",[inv]);assert.equal((await claim()).rows[0].ok,false);
 });
 await check('brand remains private to company; editing is independently delegated',async()=>{
 await db.query("insert into storage.objects(bucket_id,name) values('company-brand',$1)",[org+'/logo-'+id(100)+'.webp']);
 const read=async n=>(await as('authenticated',id(n),()=>db.query('select * from storage.objects'))).rows.length;
 assert.equal(await read(3),1);assert.equal(await read(6),0);assert.equal(await read(1),0);
 await rejected(()=>rpc("select public.update_company_brand($1,$2,'logo',$3)",[org,id(3),id(100)]));
 await rpc('select public.set_company_brand_permission($1,$2,$3,true)',[org,id(2),id(3)]);
 await rpc("select public.update_company_brand($1,$2,'logo',$3)",[org,id(3),id(100)]);
 await rejected(()=>as('authenticated',id(3),()=>db.query('select public.configure_company_team($1,$2,$3,$4,$5,true,true,true)',[org,id(3),alpha,'',id(3)])));
 });

 await db.exec(`alter table public.profiles add column plan_name text not null default 'free';
 create table public.plans(name text primary key,exercise_limit integer,exam_limit integer,project_limit integer);
 insert into public.plans values('free',20,1,1),('starter',100,5,5),('pro',500,20,20),('enterprise',900,30,30);
 create table public.account_addons(user_id uuid,addon_key text,status text);
 create table public.usage_monthly(user_id uuid,period_start date,exercises integer,exams integer,ai_queries integer,projects integer);
 create table public.stripe_webhook_events(event_id text primary key);
 grant select on public.plans,public.account_addons,public.usage_monthly to authenticated,service_role;
 grant all on public.stripe_webhook_events to service_role;`);
 await db.exec(readFileSync('supabase/migrations/20261008063418_company_messages_and_metrics.sql','utf8'));
 await db.exec('grant select on public.account_entitlements to authenticated,service_role');
 await check('company plan gives the exact existing limits, never stacks across teams or subscriptions',async()=>{
 const own=async n=>(await as('authenticated',id(n),()=>db.query('select * from public.account_entitlements'))).rows.find(r=>r.user_id===id(n));
 assert.equal((await own(5)).exercise_limit,900);assert.equal((await own(5)).project_limit,30);assert.equal((await own(5)).ai_query_limit,0);
 assert.equal((await own(8)).exercise_limit,20);
 await db.query("update public.organization_contracts set active=false where organization_id=any($1)",[[org,other]]);
 assert.equal((await own(5)).exercise_limit,20);
 await db.query("update public.organization_contracts set active=true where organization_id=any($1)",[[org,other]]);
 assert.equal((await as('authenticated',id(3),()=>db.query('select codezero_private.effective_learning_plan($1) plan',[id(5)]))).rows[0].plan,null);
 });
 await check('messages respect company/team channels, replay deduplicates, and moderation clears text',async()=>{
 const send=(actor,team,request,body)=>rpc('select public.send_company_message($1,$2,$3,$4,$5) id',[org,team,id(actor),id(request),body]);
 const a=(await send(3,alpha,301,'Mensaje de prueba 🙂')).rows[0].id;assert.equal((await send(3,alpha,301,'Mensaje de prueba 🙂')).rows[0].id,a);
 await rejected(()=>send(3,beta,302,'No permitido'));await rejected(()=>send(3,null,303,'No es un aviso autorizado'));
 await send(2,null,304,'Aviso para compañía');
 const read=async n=>(await as('authenticated',id(n),()=>db.query('select body from public.organization_messages order by created_at'))).rows.map(r=>r.body);
 assert.deepEqual(await read(4),['Aviso para compañía']);assert.deepEqual(await read(6),[]);assert.equal((await read(5)).length,2);
 await rejected(()=>rpc('select public.remove_company_message($1,$2,$3)',[org,id(4),a]));
 await rpc('select public.remove_company_message($1,$2,$3)',[org,id(2),a]);assert.equal((await db.query('select body from public.organization_messages where id=$1',[a])).rows[0].body,'');
 await rejected(()=>as('authenticated',id(3),()=>db.query('select public.send_company_message($1,$2,$3,$4,$5)',[org,alpha,id(3),id(400),'Direct client bypass'])));
 });
 await check('aggregate visits have no client read/write grants and count validated pages only',async()=>{
 await rpc("select public.record_site_visit('home')");await rpc("select public.record_site_visit('home')");
 assert.equal((await db.query("select visits from public.site_daily_metrics where page_key='home'")).rows[0].visits,2);
 await rejected(()=>rpc("select public.record_site_visit('arbitrary query with email')"));
 await rejected(()=>as('authenticated',id(3),()=>db.query('select * from public.site_daily_metrics')));
 });
 await check('deactivation revokes company tables and private images without relying on the page gate',async()=>{
 await db.query('update public.organizations set active=false where id=$1',[org]);
 for(const table of ['organization_contracts','organization_teams','organization_team_members','organization_team_grants','organization_invitations'])assert.equal((await as('authenticated',id(2),()=>db.query('select * from public.'+table+' where organization_id=$1',[org]))).rows.length,0,table);
 assert.equal((await as('authenticated',id(3),()=>db.query("select * from storage.objects where bucket_id='company-brand'"))).rows.length,0);
 await db.query('update public.organizations set active=true where id=$1',[org]);
 await db.query("update public.profiles set status='suspended' where id=$1",[id(3)]);assert.equal((await as('authenticated',id(3),()=>db.query('select * from public.organization_teams'))).rows.length,0);
 });
 console.log(`PASS ${checks} company access/capacity PostgreSQL groups`);
}finally{await db.close();}
