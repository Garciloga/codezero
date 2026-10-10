import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";

// All data in this check lives in an ephemeral in-memory database.
const db=new PGlite();
const id=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const create=[
 "create role anon;",
 "create role authenticated;",
 "create role service_role bypassrls;",
 "create schema auth;",
 "create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;",
 "create table public.profiles(id uuid primary key,status text not null);",
 "create table public.organizations(id uuid primary key);",
 "create table public.organization_memberships(organization_id uuid not null references public.organizations(id),user_id uuid not null references public.profiles(id),role text not null,active boolean not null,reports_to uuid,primary key(organization_id,user_id),foreign key(organization_id,reports_to) references public.organization_memberships(organization_id,user_id));",
 "create table public.organization_teams(id uuid primary key,organization_id uuid not null references public.organizations(id),name text not null,unique(organization_id,id));",
 "create table public.organization_team_members(organization_id uuid not null,team_id uuid not null,user_id uuid not null,primary key(organization_id,team_id,user_id),foreign key(organization_id,team_id) references public.organization_teams(organization_id,id),foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id));",
 "create table public.organization_team_grants(organization_id uuid not null,team_id uuid not null,user_id uuid not null,can_view boolean not null default false,can_invite boolean not null default false,primary key(organization_id,team_id,user_id),foreign key(organization_id,team_id) references public.organization_teams(organization_id,id),foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id));",
 "create table public.learning_assignments(organization_id uuid,user_id uuid,activity_key text);",
 "grant usage on schema public,auth to authenticated,service_role;",
 "grant select on public.organization_memberships,public.profiles to authenticated;",
 "grant all on all tables in schema public to service_role;"
].join("\n");
let checks=0;
const check=async(label,fn)=>{await fn();checks++;console.log("PASS",label);};
const denied=fn=>assert.rejects(fn);
const withRole=async(role,uid,fn)=>{
 await db.exec("set role "+role);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
 try{return await fn();}finally{await db.exec("reset role");}
};
try {
 await db.exec(create);
 await db.exec(readFileSync("supabase/sandbox/migrations/20261011110000_course_assignment_drafts.sql","utf8"));
 for(const n of [1,2,3,4,5,6,7,8,9]){
   await db.query("insert into public.profiles(id,status) values($1,$2)",[id(n),n===8?"suspended":"active"]);
 }
 for(const n of [10,20])await db.query("insert into public.organizations(id) values($1)",[id(n)]);
 const members=[
  [10,1,"owner",true,null],[10,2,"manager",true,null],[10,3,"learner",true,2],
  [10,4,"learner",true,null],[20,5,"learner",true,null],[10,6,"supervisor",true,null],
  [10,7,"learner",false,null],[10,8,"learner",true,null],[20,9,"owner",true,null]
 ];
 for(const [org,user,role,active,boss] of members)
  await db.query("insert into public.organization_memberships(organization_id,user_id,role,active,reports_to) values($1,$2,$3,$4,$5)",[id(org),id(user),role,active,boss?id(boss):null]);
 for(const [team,name] of [[101,"Alfa"],[102,"Beta"]])
  await db.query("insert into public.organization_teams(id,organization_id,name) values($1,$2,$3)",[id(team),id(10),name]);
 for(const [team,user] of [[101,3],[102,4],[102,7],[102,8]])
  await db.query("insert into public.organization_team_members(organization_id,team_id,user_id) values($1,$2,$3)",[id(10),id(team),id(user)]);
 for(const [team,user,view,assign] of [[102,2,true,false],[102,6,false,true]])
  await db.query("insert into public.organization_team_grants(organization_id,team_id,user_id,can_view,can_invite,can_assign_courses) values($1,$2,$3,$4,false,$5)",[id(10),id(team),id(user),view,assign]);
 const due=(await db.query("select (current_date+30)::text as due")).rows[0].due;
 const assign=(actor,user,team,org=10)=>withRole("service_role",id(actor),()=>db.query("select public.assign_draft_learning_route($1,$2,$3,$4,$5,$6,$7,$8) as saved",[id(org),id(actor),user?id(user):null,team?id(team):null,"grc_advanced","diagnosis","focused",due]));
 await check("RPC explicitly inaccessible to authenticated clients",async()=>{
   const r=await db.query("select has_function_privilege('authenticated','public.assign_draft_learning_route(uuid,uuid,uuid,uuid,text,text,text,date)','EXECUTE') as allowed");
   assert.equal(r.rows[0].allowed,false);
   await denied(()=>withRole("authenticated",id(3),()=>db.query("select public.assign_draft_learning_route($1,$2,$3,$4,$5,$6,$7,$8)",[id(10),id(3),id(3),null,"grc_advanced","diagnosis","base",due])));
 });
 await check("manager can plan for direct report but not other teams based on view alone",async()=>{
   assert.equal((await assign(2,3,101)).rows[0].saved,1);
   await denied(()=>assign(2,4,102));
 });
 await check("team assignment permission is distinct from view and never leaks companies",async()=>{
   assert.equal((await assign(6,null,102)).rows[0].saved,1);
   await denied(()=>assign(6,3,101));
   await denied(()=>assign(6,5,102));
   await denied(()=>assign(6,5,null,20));
 });
 await check("inactive or suspended targets are excluded even from owner/team assignment",async()=>{
   await denied(()=>assign(1,7,null));
   await denied(()=>assign(1,8,null));
   await denied(()=>assign(1,5,null));
   assert.equal((await assign(1,4,null)).rows[0].saved,1);
 });
 await check("revoking the separate permission immediately stops delegated assignment",async()=>{
   await db.query("update public.organization_team_grants set can_assign_courses=false where user_id=$1",[id(6)]);
   await denied(()=>assign(6,4,102));
 });
 await check("RLS returns only active employee's own records",async()=>{
   const own3=await withRole("authenticated",id(3),()=>db.query("select user_id from public.organization_course_assignment_drafts"));
   const own4=await withRole("authenticated",id(4),()=>db.query("select user_id from public.organization_course_assignment_drafts"));
   const other=await withRole("authenticated",id(5),()=>db.query("select user_id from public.organization_course_assignment_drafts"));
   assert.ok(own3.rows.length>=1&&own3.rows.every(r=>r.user_id===id(3)));
   assert.ok(own4.rows.length>=1&&own4.rows.every(r=>r.user_id===id(4)));
   assert.equal(other.rows.length,0);
 });
 await check("course draft has no effect on real learning assignment records",async()=>{
   assert.equal((await db.query("select count(*)::integer as n from public.learning_assignments")).rows[0].n,0);
 });
 console.log("Course assignment isolated database checks:",checks,"passed");
}finally{await db.close();}
