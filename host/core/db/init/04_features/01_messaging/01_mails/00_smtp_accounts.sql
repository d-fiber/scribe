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

create table if not exists public.internal_t__smtp_accounts (
  smtp_account_id     bigint  primary key generated always as identity,
  name                text    not null unique,
  host                text,
  port                integer check (port > 0 and port <= 65535),
  username            text,
  password_encrypted  bytea,
  is_active           boolean not null default true,
  created_at          bigint  not null,
  updated_at          bigint  not null,

  constraint smtp_accounts_complete_or_env check (
    (host is null and port is null and username is null and password_encrypted is null)
    or (host is not null and port is not null and username is not null and password_encrypted is not null)
  )
);

alter table public.internal_t__smtp_accounts enable row level security;

revoke all on public.internal_t__smtp_accounts from authenticated, anon;

create trigger smtp_accounts_set_timestamps
  before insert or update on public.internal_t__smtp_accounts
  for each row execute function public.set_timestamps();

insert into public.internal_t__smtp_accounts (name) values
  ('account'),
  ('noreply')
on conflict (name) do nothing;

create or replace function public.upsert_smtp_account(
  p_name     text,
  p_host     text,
  p_port     integer,
  p_username text,
  p_password text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := current_setting('app.settings.smtp_key', true);
  v_id  bigint;
begin
  if v_key is null or v_key = '' then
    raise exception '[upsert_smtp_account] app.settings.smtp_key is not set';
  end if;

  insert into public.internal_t__smtp_accounts (name, host, port, username, password_encrypted)
  values (p_name, p_host, p_port, p_username, pgp_sym_encrypt(p_password, v_key))
  on conflict (name) do update
    set host               = excluded.host,
        port               = excluded.port,
        username           = excluded.username,
        password_encrypted = excluded.password_encrypted
  returning smtp_account_id into v_id;

  return v_id;
end;
$$;

create or replace function public.smtp_accounts_list()
returns table (
  name          text,
  host          text,
  port          integer,
  username      text,
  is_configured boolean,
  is_active     boolean,
  created_at    bigint,
  updated_at    bigint
)
language sql
security definer
set search_path = public
as $$
  select a.name,
         a.host,
         a.port,
         a.username,
         a.password_encrypted is not null,
         a.is_active,
         a.created_at,
         a.updated_at
  from public.internal_t__smtp_accounts a
  order by a.name;
$$;

create or replace function public.smtp_account_summary(p_name text)
returns table (
  name          text,
  host          text,
  port          integer,
  username      text,
  is_configured boolean,
  is_active     boolean,
  created_at    bigint,
  updated_at    bigint
)
language sql
security definer
set search_path = public
as $$
  select a.name,
         a.host,
         a.port,
         a.username,
         a.password_encrypted is not null,
         a.is_active,
         a.created_at,
         a.updated_at
  from public.internal_t__smtp_accounts a
  where a.name = p_name;
$$;

create or replace function public.set_smtp_account_active(
  p_name      text,
  p_is_active boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_found boolean;
begin
  update public.internal_t__smtp_accounts
     set is_active = p_is_active
   where name = p_name
  returning true into v_found;

  return coalesce(v_found, false);
end;
$$;

create or replace function public.clear_smtp_account_credentials(p_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_found boolean;
begin
  update public.internal_t__smtp_accounts
     set host               = null,
         port               = null,
         username           = null,
         password_encrypted = null
   where name = p_name
  returning true into v_found;

  return coalesce(v_found, false);
end;
$$;

create or replace function public.delete_smtp_account(p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_found boolean;
begin
  if p_name in ('account', 'noreply') then
    return 'reserved';
  end if;

  begin
    delete from public.internal_t__smtp_accounts
     where name = p_name
    returning true into v_found;
  exception when foreign_key_violation then
    return 'in_use';
  end;

  return case when coalesce(v_found, false) then 'deleted' else 'not_found' end;
end;
$$;

create or replace function public.smtp_account_credentials(p_name text)
returns table (name text, host text, port integer, username text, password text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := current_setting('app.settings.smtp_key', true);
begin
  return query
  select a.name,
         a.host,
         a.port,
         a.username,
         case
           when a.password_encrypted is null then null
           else pgp_sym_decrypt(a.password_encrypted, v_key)
         end
  from public.internal_t__smtp_accounts a
  where a.name = p_name
    and a.is_active = true;
end;
$$;
