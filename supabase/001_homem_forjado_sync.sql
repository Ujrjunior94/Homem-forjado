begin;

create table if not exists public.hf_study_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 1 check (revision > 0),
  backup jsonb not null check (jsonb_typeof(backup) = 'object' and octet_length(backup::text) <= 1000000),
  updated_at timestamptz not null default now()
);

alter table public.hf_study_backups enable row level security;
revoke all on public.hf_study_backups from public, anon, authenticated;
grant select on public.hf_study_backups to authenticated;
drop policy if exists hf_read_own_backup on public.hf_study_backups;
create policy hf_read_own_backup on public.hf_study_backups
  for select to authenticated using ((select auth.uid()) = user_id);

create schema if not exists hf_private;
revoke all on schema hf_private from public, anon;
grant usage on schema hf_private to authenticated;

create or replace function hf_private.hf_save_study_backup(expected_revision integer, next_backup jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  saved_revision integer;
begin
  if owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if expected_revision = 0 then
    insert into public.hf_study_backups (user_id, backup)
      values (owner_id, next_backup)
      on conflict (user_id) do nothing
      returning revision into saved_revision;
  else
    update public.hf_study_backups
      set backup = next_backup, revision = revision + 1, updated_at = now()
      where user_id = owner_id and revision = expected_revision
      returning revision into saved_revision;
  end if;
  return saved_revision;
end;
$$;

revoke all on function hf_private.hf_save_study_backup(integer,jsonb) from public,anon;
grant execute on function hf_private.hf_save_study_backup(integer,jsonb) to authenticated;

create or replace function public.hf_save_study_backup(expected_revision integer,next_backup jsonb)
returns integer language sql security invoker set search_path='' as $$
  select hf_private.hf_save_study_backup(expected_revision,next_backup);
$$;
revoke all on function public.hf_save_study_backup(integer, jsonb) from public, anon;
grant execute on function public.hf_save_study_backup(integer, jsonb) to authenticated;
commit;
