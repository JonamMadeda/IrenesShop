create extension if not exists pgcrypto;

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.users(id) on delete cascade,
  actor_user_id uuid not null,
  actor_name text,
  actor_email text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_name text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_logs_shop_id_created_at_idx
  on public.system_logs (shop_id, created_at desc);

create index if not exists system_logs_actor_user_id_idx
  on public.system_logs (actor_user_id);

alter table public.system_logs enable row level security;

drop policy if exists "system_logs_select_access" on public.system_logs;
create policy "system_logs_select_access"
on public.system_logs
for select
to authenticated
using (
  shop_id = auth.uid()
  or shop_id in (
    select owner_id
    from public.users
    where id = auth.uid()
      and owner_id is not null
  )
);

drop policy if exists "system_logs_insert_access" on public.system_logs;
create policy "system_logs_insert_access"
on public.system_logs
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    shop_id = auth.uid()
    or shop_id in (
      select owner_id
      from public.users
      where id = auth.uid()
        and owner_id is not null
    )
  )
);
