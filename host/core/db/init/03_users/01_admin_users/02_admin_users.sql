-- Copyright (C) 2026 Fiber
--
-- This file is part of scribe and is made available under the PolyForm Shield
-- License 1.0.0. The full terms are in the LICENSE file at the root of this
-- repository, and at https://polyformproject.org/licenses/shield/1.0.0
--
-- What you may do:
-- - Use this software for any purpose, including commercially, and build and
--   sell your own products on top of it.
-- - Change it, and create new works based on it.
-- - Distribute copies of it, with or without your changes.
--
-- The one thing you may not do:
-- - Use it to provide any product that competes with scribe, or with any
--   product Fiber or its affiliates provide using scribe. Products compete
--   even when they are offered free of charge, through a different kind of
--   interface, or for a different technical platform.
--
-- If you pass this software on:
-- - Anyone who receives any part of it from you must also receive these terms,
--   or the URL above, together with the "Required Notice" line carried by the
--   LICENSE file.
--
-- Disclaimer:
-- AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
-- CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
-- OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
-- LEGAL CLAIM.
--
-- This header is a summary written for convenience. Where it differs from the
-- LICENSE file, the LICENSE file governs.

create table if not exists public.internal_t__admin_users (
  admin_id                uuid     primary key references auth.users(id) on delete cascade,
  role                    text     not null references public.internal_t__admin_users_roles(role),
  email                   varchar  not null,
  is_email_verified       boolean  not null default false,
  phone                   varchar  not null,
  is_phone_verified       boolean  not null default false,
  created_at              bigint   not null,
  updated_at              bigint   not null
);

create unique index if not exists admin_users_email_unique
  on public.internal_t__admin_users (email);

create unique index if not exists admin_users_phone_unique
  on public.internal_t__admin_users (phone);

alter table public.internal_t__admin_users enable row level security;
alter table public.internal_t__admin_users force row level security;

grant select on public.internal_t__admin_users to authenticated;
grant update (phone) on public.internal_t__admin_users to authenticated;

revoke insert, delete on public.internal_t__admin_users from authenticated, anon;
revoke update on public.internal_t__admin_users from anon;

create policy "admins_select" on public.internal_t__admin_users
  for select using (
    auth.uid() = admin_id
    and (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );

create policy "admins_update" on public.internal_t__admin_users
  for update using (
    auth.uid() = admin_id
    and (auth.jwt()->'app_metadata'->>'role') = 'admin'
  )
  with check (
    admin_id           = auth.uid()
    and role              = (select role              from public.internal_t__admin_users where admin_id = auth.uid())
    and email             = (select email             from public.internal_t__admin_users where admin_id = auth.uid())
    and is_email_verified = (select is_email_verified from public.internal_t__admin_users where admin_id = auth.uid())
    and is_phone_verified = (select is_phone_verified from public.internal_t__admin_users where admin_id = auth.uid())
    and created_at        = (select created_at        from public.internal_t__admin_users where admin_id = auth.uid())
  );

create or replace function set_admin_defaults()
returns trigger as $$
declare
  now_ms bigint := extract(epoch from now()) * 1000;
begin
  if tg_op = 'INSERT' then
    new.created_at := now_ms;
    new.updated_at := now_ms;
    new.is_phone_verified := true;
  else
    new.updated_at := now_ms;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger admins_set_defaults
  before insert or update on public.internal_t__admin_users
  for each row execute function set_admin_defaults();

create or replace function sync_auth_admin_fields()
returns trigger as $$
begin
  update public.internal_t__admin_users set
    email             = new.email,
    is_email_verified = new.email_confirmed_at is not null,
    phone             = coalesce(new.phone, '')
  where admin_id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_admin_updated
  after update on auth.users
  for each row execute function sync_auth_admin_fields();