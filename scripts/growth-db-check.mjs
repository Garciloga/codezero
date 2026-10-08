import {PGlite} from '@electric-sql/pglite';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite(),id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');const source=fs.readFileSync('scripts/role-training-db-check.mjs','utf8'),fixture=source.match(/await db\.exec\(`(create role anon;[\s\S]*?)`\);/)[1];
const as=async(role,user,fn)=>{await db.exec('begin;set local role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);try{const r=await fn();await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}};
try{
 await db.exec(new Function('id','return `'+fixture+'`')(id));await db.exec(fs.readFileSync('supabase/migrations/20261008044128_production_role_training_and_project_approval.sql','utf8'));
 const sql=fs.readFileSync('supabase/migrations/20261008212753_learning_growth_and_notices.sql','utf8').split('-- Read-state retention')[0];await db.exec(sql);
 await db.exec(`insert into learning_activity_catalog(content_key,route_key,title,kind,competencies) values('goal-test','common','test','deliverable',array['data']);`);
 const goals=[{key:'data',target:3,baseline:1,activity:'goal-test'}];const propose=(actor,user,plan,gs=goals)=>as('service_role',actor,()=>db.query('select propose_learning_development_plan($1,$2,$3,$4,$5,now()+interval \'2 days\',$6)',[actor,id(10),user,plan,JSON.stringify(gs),JSON.stringify({competencies:[]})]));
 await assert.rejects(()=>propose(id(4),id(3),id(101)));await assert.rejects(()=>propose(id(2),id(4),id(101)));await assert.rejects(()=>propose(id(5),id(3),id(101)));await assert.rejects(()=>propose(id(2),id(3),id(101),[...goals,...goals]));
 await propose(id(2),id(3),id(101));assert.equal((await db.query('select count(*)::int n from learning_assignments')).rows[0].n,1);assert.equal((await db.query('select count(*)::int n from learning_evidence_history')).rows[0].n,0);
 for(const user of [id(4),id(5)])assert.equal((await as('authenticated',user,()=>db.query('select * from learning_development_plans'))).rows.length,0);
 assert.equal((await as('authenticated',id(3),()=>db.query('select * from learning_development_plans'))).rows.length,1);assert.equal((await as('authenticated',id(2),()=>db.query('select * from learning_development_plans'))).rows.length,1);
 const respond=(actor,revision)=>as('service_role',actor,()=>db.query("select respond_learning_development_plan($1,$2,$3,'accept','')",[actor,id(101),revision]));await assert.rejects(()=>respond(id(2),1));await respond(id(3),1);await assert.rejects(()=>respond(id(3),1));assert.equal((await db.query('select state from learning_development_plans')).rows[0].state,'accepted');
 for(const table of ['notice_preferences','notice_read_states'])await assert.rejects(()=>as('authenticated',id(3),()=>db.query('delete from '+table)));
 await db.query('insert into notice_read_states(user_id,event_key) values($1,$2)',[id(3),'review:1']);assert.equal((await as('authenticated',id(4),()=>db.query('select * from notice_read_states'))).rows.length,0);
 await assert.rejects(()=>as('anon',id(3),()=>db.query('select * from learning_development_plans')));console.log('PASS growth PostgreSQL: tenant/scope/suspension, validation, atomic assignments, no score change, acceptance concurrency, read-state isolation');
}finally{await db.close();}
