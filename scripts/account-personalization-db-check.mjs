import {PGlite} from '@electric-sql/pglite';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
async function as(user,fn){await db.exec(`begin;set local role authenticated;set local "request.jwt.claim.sub"='${user}';`);try{const result=await fn();await db.exec('rollback');return result;}catch(error){await db.exec('rollback');throw error;}}
try {
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create schema codezero_private;grant usage on schema auth,storage,codezero_private to authenticated,service_role;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table public.profiles(id uuid primary key);create table public.user_preferences(user_id uuid primary key,mode text,accent text);
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id bigint generated always as identity primary key,bucket_id text,name text,unique(bucket_id,name));alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to authenticated;grant usage,select on all sequences in schema storage to authenticated;grant select,insert,update on public.user_preferences to authenticated;
insert into storage.objects(bucket_id,name) values('profile-photos','${a}/avatar.webp'),('profile-photos','${b}/avatar.webp'),('other-bucket','${a}/avatar.webp');`);
const migration=fs.readdirSync('supabase/migrations').find(f=>f.endsWith('_account_palette_and_profile_photos.sql'));await db.exec(fs.readFileSync('supabase/migrations/'+migration,'utf8'));
assert.deepEqual((await db.query("select public,file_size_limit,allowed_mime_types from storage.buckets where id='profile-photos'")).rows[0],{public:false,file_size_limit:2097152,allowed_mime_types:['image/webp']});
await as(a,async()=>{assert.deepEqual((await db.query('select name from storage.objects')).rows,[{name:a+'/avatar.webp'}]);assert.equal((await db.query("update storage.objects set name=name where name=$1 returning id",[b+'/avatar.webp'])).rows.length,0);assert.equal((await db.query('delete from storage.objects where name=$1 returning id',[b+'/avatar.webp'])).rows.length,0);await db.query('update storage.objects set name=name where name=$1',[a+'/avatar.webp']);await db.query('delete from storage.objects where name=$1',[a+'/avatar.webp']);await db.query("insert into storage.objects(bucket_id,name) values('profile-photos',$1)",[a+'/avatar.webp']);});
await assert.rejects(()=>as(a,()=>db.query("insert into storage.objects(bucket_id,name) values('profile-photos',$1)",[b+'/wrong.webp'])));
await assert.rejects(()=>as(a,()=>db.query("update storage.objects set name=$1 where name=$2",[b+'/avatar.webp',a+'/avatar.webp'])));
for(const value of [{light:{border:'#112233'}},{dark:{selection:'#fedcba'}},{}])assert.equal((await db.query('select codezero_private.valid_account_palette($1::jsonb) ok',[JSON.stringify(value)])).rows[0].ok,true);
for(const value of [{light:{bg:'url(x)'}},{light:{unknown:'#112233'}},{light:[]},[]])assert.equal((await db.query('select codezero_private.valid_account_palette($1::jsonb) ok',[JSON.stringify(value)])).rows[0].ok,false);
console.log('PASS private photo bucket, own read/upload/update/delete, cross-account rejection and palette constraints');
}finally{await db.close();}
