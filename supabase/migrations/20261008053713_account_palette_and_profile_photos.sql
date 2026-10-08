begin;
alter table public.user_preferences add column colors jsonb not null default '{}'::jsonb;
alter table public.profiles add column avatar_version uuid;
create function codezero_private.valid_account_palette(value jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare m record; c record;
begin
 if jsonb_typeof(value) <> 'object' then return false; end if;
 for m in select * from jsonb_each(value) loop
  if m.key not in ('light','dark') or jsonb_typeof(m.value)<>'object' then return false; end if;
  for c in select * from jsonb_each(m.value) loop
   if c.key not in ('bg','surface','text','muted','sidebar','sidebar-card','sidebar-text','sidebar-muted','primary','button-text','hover','soft','accent','selected-text','border','border-strong','focus','selection','selection-text','positive','reinforce','alert-bg','alert-text') or jsonb_typeof(c.value)<>'string' or (c.value #>> '{}') !~ '^#[0-9A-Fa-f]{6}$' then return false; end if;
  end loop;
 end loop;
 return true;
end $$;
revoke all on function codezero_private.valid_account_palette(jsonb) from public,anon;
grant execute on function codezero_private.valid_account_palette(jsonb) to authenticated,service_role;
alter table public.user_preferences add constraint valid_account_palette check(codezero_private.valid_account_palette(colors));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('profile-photos','profile-photos',false,2097152,array['image/webp']);
create policy profile_photos_read on storage.objects for select to authenticated
 using(bucket_id='profile-photos' and name=(select auth.uid())::text || '/avatar.webp');
create policy profile_photos_insert on storage.objects for insert to authenticated
 with check(bucket_id='profile-photos' and name=(select auth.uid())::text || '/avatar.webp');
create policy profile_photos_update on storage.objects for update to authenticated
 using(bucket_id='profile-photos' and name=(select auth.uid())::text || '/avatar.webp')
 with check(bucket_id='profile-photos' and name=(select auth.uid())::text || '/avatar.webp');
create policy profile_photos_delete on storage.objects for delete to authenticated
 using(bucket_id='profile-photos' and name=(select auth.uid())::text || '/avatar.webp');
commit;
