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

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'admin') then
    create role admin;
    grant authenticated to admin;
  end if;
end $$;

create table if not exists public.internal_t__admin_users_roles (
  role  text  primary key
);

create table if not exists public.internal_t__admin_users_permissions (
  permission  text  primary key
);

create table if not exists public.internal_t__admin_users_role_permissions (
  role        text  not null references public.internal_t__admin_users_roles(role)             on delete cascade,
  permission  text  not null references public.internal_t__admin_users_permissions(permission) on delete cascade,
  primary key (role, permission)
);

insert into public.internal_t__admin_users_roles values ('owner'), ('basic')
  on conflict (role) do nothing;

insert into public.internal_t__admin_users_permissions values
  ('intra:supabase'),
  ('intra:vpn'),
  ('intra:developers:docs'),
  ('intra:developers:docs:admin'),
  ('intra:developers:docs:app'),
  ('vpn:download'),
  ('vpn:renew'),
  ('role:create'),
  ('role:read'),
  ('role:update'),
  ('role:delete'),
  ('team:create'),
  ('team:read'),
  ('team:update'),
  ('team:delete');

insert into public.internal_t__admin_users_role_permissions values
  ('owner', 'intra:supabase'),
  ('owner', 'intra:vpn'),
  ('owner', 'intra:developers:docs'),
  ('owner', 'intra:developers:docs:admin'),
  ('owner', 'intra:developers:docs:app'),
  ('owner', 'vpn:download'),
  ('owner', 'vpn:renew'),
  ('owner', 'role:create'),
  ('owner', 'role:read'),
  ('owner', 'role:update'),
  ('owner', 'role:delete'),
  ('owner', 'team:create'),
  ('owner', 'team:read'),
  ('owner', 'team:update'),
  ('owner', 'team:delete');

create or replace function admin_role_create(p_role text, p_permissions text[])
returns void as $$
begin
  insert into public.internal_t__admin_users_roles (role) values (p_role);

  insert into public.internal_t__admin_users_role_permissions (role, permission)
  select p_role, unnest(p_permissions);
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function admin_role_replace_permissions(p_role text, p_permissions text[])
returns void as $$
begin
  delete from public.internal_t__admin_users_role_permissions where role = p_role;

  if array_length(p_permissions, 1) is not null then
    insert into public.internal_t__admin_users_role_permissions (role, permission)
    select p_role, unnest(p_permissions);
  end if;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function admin_role_delete(p_role text, p_fallback text)
returns setof uuid as $$
begin
  return query
  update public.internal_t__admin_users
     set role = p_fallback, updated_at = extract(epoch from now()) * 1000
   where role = p_role
  returning admin_id;

  delete from public.internal_t__admin_users_roles where role = p_role;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function admin_role_create(text, text[])              from public, anon, authenticated;
revoke all on function admin_role_replace_permissions(text, text[]) from public, anon, authenticated;
revoke all on function admin_role_delete(text, text)                from public, anon, authenticated;
