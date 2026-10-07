import assert from 'node:assert/strict';import { PGlite } from '@electric-sql/pglite';import fs from 'node:fs';
const db=new PGlite();
try{
 await db.exec(`create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create table public.profiles(id uuid primary key,email text,full_name text,role text default 'student',plan_name text default 'free');create table public.usage_monthly(user_id uuid,period_start date);`);
 const migration=fs.readdirSync('supabase/migrations').find(f=>f.endsWith('_profile_registration_name.sql'));await db.exec(fs.readFileSync('supabase/migrations/'+migration,'utf8'));await db.exec(`create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();`);
 for(const [n,metadata,expected]of [[1,{full_name:'  Persona de prueba  ',role:'owner',plan_name:'pro',locale:'fr'},'Persona de prueba'],[2,{full_name:'x'},null],[3,{full_name:'a'.repeat(101)},null],[4,{full_name:{name:'Persona'}},null],[5,{},null]]){
 const id=`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;await db.query('insert into auth.users values($1,$2,$3)',[id,'persona@codezero.example.test',metadata]);const row=(await db.query('select * from profiles where id=$1',[id])).rows[0];assert.equal(row.full_name,expected);assert.equal(row.role,'student');assert.equal(row.plan_name,'free');assert.equal((await db.query('select * from usage_monthly where user_id=$1',[id])).rows.length,1);
 }
 await db.exec(`update profiles set full_name='Nombre editado' where id='00000000-0000-4000-8000-000000000001';`);await db.exec(fs.readFileSync('supabase/migrations/'+migration,'utf8'));assert.equal((await db.query("select full_name from profiles where id='00000000-0000-4000-8000-000000000001'")).rows[0].full_name,'Nombre editado');console.log('PASS 6 registration/name cases; role, plan and quota initialization preserved; no remote users created');
}finally{await db.close();}
