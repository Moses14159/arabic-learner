-- Qalam milestone 1: append-only, account-scoped learning history.
-- All business writes go through the authenticated Vercel API using a server key.
-- The sequence is shared by both tables; each user's writes acquire the same
-- transaction lock before allocating sequence numbers, so cursor pagination
-- cannot skip an earlier uncommitted write from that user.
create sequence public.qalam_change_seq as bigint;

create table public.qalam_learning_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  seq bigint not null default nextval('public.qalam_change_seq') unique,
  received_at timestamptz not null default now(),
  event jsonb not null,
  primary key (user_id, id),
  constraint qalam_event_object check (coalesce(
    jsonb_typeof(event) = 'object'
    and event ->> 'id' = id::text
    and jsonb_typeof(event -> 'payload') = 'object'
    and event ->> 'type' in ('attempt', 'session', 'mistake', 'mistake-remove', 'mistakes-clear', 'history-clear', 'preference', 'tajweed-check'), false)
  )
);
create index qalam_events_user_cursor on public.qalam_learning_events (user_id, seq);

create table public.qalam_legacy_imports (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  seq bigint not null default nextval('public.qalam_change_seq') unique,
  received_at timestamptz not null default now(),
  source text not null default 'legacy_import' check (source = 'legacy_import'),
  content_version text not null default 'legacy_unversioned' check (content_version = 'legacy_unversioned'),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  primary key (user_id, id)
);
create index qalam_imports_user_cursor on public.qalam_legacy_imports (user_id, seq);

alter table public.qalam_learning_events enable row level security;
alter table public.qalam_legacy_imports enable row level security;
create policy qalam_read_own_events on public.qalam_learning_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy qalam_read_own_imports on public.qalam_legacy_imports for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.qalam_learning_events, public.qalam_legacy_imports from public, anon, authenticated;
grant select on public.qalam_learning_events, public.qalam_legacy_imports to authenticated;
grant select, insert, update, delete on public.qalam_learning_events, public.qalam_legacy_imports to service_role;
revoke all on sequence public.qalam_change_seq from public, anon, authenticated;
grant usage, select on sequence public.qalam_change_seq to service_role;

create function public.qalam_append_learning(p_user uuid, p_events jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare inserted_count integer;
begin
  if p_user is null or p_events is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) not between 1 and 100 then
    raise exception 'Invalid event batch' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 0));
  insert into public.qalam_learning_events (user_id, id, event)
    select p_user, (entry ->> 'id')::uuid, entry
      from jsonb_array_elements(p_events) with ordinality as batch(entry, item_order)
      order by item_order
    on conflict (user_id, id) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create function public.qalam_import_learning(p_user uuid, p_import jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare inserted_count integer;
begin
  if p_user is null or p_import is null or jsonb_typeof(p_import) <> 'object' or coalesce(jsonb_typeof(p_import -> 'snapshot'), '') <> 'object' then
    raise exception 'Invalid historical snapshot' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 0));
  insert into public.qalam_legacy_imports (user_id, id, snapshot)
    values (p_user, (p_import ->> 'id')::uuid, p_import -> 'snapshot')
    on conflict (user_id, id) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create function public.qalam_pull_learning(p_user uuid, p_after bigint default 0, p_limit integer default 200)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare result jsonb;
begin
  if p_user is null or p_after is null or p_after < 0 or p_limit is null or p_limit not between 1 and 200 then
    raise exception 'Invalid page request' using errcode = '22023';
  end if;
  with changes as (
    select seq, jsonb_build_object('seq', seq, 'event', event) as change
      from public.qalam_learning_events where user_id = p_user and seq > p_after
    union all
    select seq, jsonb_build_object('seq', seq, 'import', jsonb_build_object('id', id, 'snapshot', snapshot)) as change
      from public.qalam_legacy_imports where user_id = p_user and seq > p_after
  ), windowed as (
    select seq, change from changes order by seq limit (p_limit + 1)
  ), page as (
    select seq, change from windowed order by seq limit p_limit
  )
  select jsonb_build_object(
    'changes', coalesce((select jsonb_agg(change order by seq) from page), '[]'::jsonb),
    'nextCursor', coalesce((select max(seq) from page), p_after),
    'hasMore', (select count(*) from windowed) > p_limit
  ) into result;
  return result;
end;
$$;

revoke all on function public.qalam_append_learning(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.qalam_import_learning(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.qalam_pull_learning(uuid, bigint, integer) from public, anon, authenticated;
grant execute on function public.qalam_append_learning(uuid, jsonb) to service_role;
grant execute on function public.qalam_import_learning(uuid, jsonb) to service_role;
grant execute on function public.qalam_pull_learning(uuid, bigint, integer) to service_role;
