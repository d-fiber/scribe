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

create table if not exists public.internal_t__remote_configs (
  remote_config_id  bigint    primary key generated always as identity,
  key               text      not null unique,
  value             jsonb     not null,
  audience          public.remote_config_audience not null default 'public',
  description       text,
  is_active         boolean   not null default true,
  hash              text      not null default '',
  created_at        bigint    not null,
  updated_at        bigint    not null
);

create index if not exists remote_configs_lookup_idx
  on public.internal_t__remote_configs (audience)
  where is_active = true;

alter table public.internal_t__remote_configs enable row level security;

revoke all on public.internal_t__remote_configs from authenticated, anon;

create or replace function set_remote_config_defaults()
returns trigger as $$
declare
  now_ms bigint := extract(epoch from now()) * 1000;
begin
  if tg_op = 'INSERT' then
    new.created_at := now_ms;
    new.updated_at := now_ms;
  else
    new.updated_at := now_ms;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger remote_configs_set_defaults
  before insert or update on public.internal_t__remote_configs
  for each row execute function set_remote_config_defaults();

create or replace function set_remote_config_hash()
returns trigger as $$
begin
  new.hash := encode(
    digest(
      new.key
        || chr(30) || new.value::text
        || chr(30) || new.audience::text
        || chr(30) || new.is_active::text,
      'sha256'
    ),
    'hex'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger remote_configs_set_hash
  before insert or update on public.internal_t__remote_configs
  for each row execute function set_remote_config_hash();

create or replace function public.visible_remote_config_audiences(p_caller_type text)
returns public.remote_config_audience[]
language sql
immutable
as $$
  select case p_caller_type
    when 'user' then array['public', 'authenticated', 'user']::public.remote_config_audience[]
    when 'admin' then array['public', 'authenticated', 'admin']::public.remote_config_audience[]
    else array['public']::public.remote_config_audience[]
  end;
$$;
