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

create table if not exists public.internal_t__admin_users_devices (
  id                  uuid                    primary key default gen_random_uuid(),
  admin_id            uuid                    not null references public.internal_t__admin_users(admin_id) on delete cascade,
  device_id           varchar(256)            not null,
  client              public.client_type      not null,
  os                  public.device_os        not null,
  model               varchar(255)            not null,
  is_physical_device  boolean                 not null,
  device_category     public.device_category  not null,
  app_version         text,
  hash                text,
  ip                  varchar(45)             not null,
  city                varchar(100)            not null,
  country             varchar(100)            not null,
  created_at          bigint                  not null,
  updated_at          bigint                  not null,
  trusted_at          bigint                  not null default (extract(epoch from now()) * 1000)::bigint,

  unique (admin_id, device_id)
);

-- No index on (admin_id) alone. The `unique (admin_id, device_id)` constraint
-- above already creates a composite index whose left prefix serves lookups on
-- admin_id, and a second index would only make every write heavier. The hot
-- query on the request path, `where admin_id = $1 and device_id = $2`, is
-- served by the constraint.

alter table public.internal_t__admin_users_devices enable row level security;

grant select on public.internal_t__admin_users_devices to authenticated;

revoke insert, update, delete on public.internal_t__admin_users_devices from authenticated, anon;

create policy "admin_devices_select" on public.internal_t__admin_users_devices
  for select using (
    auth.uid() = admin_id
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create or replace function set_admin_device_defaults()
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

create trigger admin_devices_set_defaults
  before insert or update on public.internal_t__admin_users_devices
  for each row execute function set_admin_device_defaults();

create or replace function notify_new_admin_device()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text;
  v_name    text;
  v_locale  text;
begin
  select email into v_email
  from public.internal_t__admin_users
  where admin_id = new.admin_id;

  select first_name into v_name
  from public.internal_t__admin_users_profiles
  where admin_id = new.admin_id;

  select localization::text into v_locale
  from public.internal_t__admin_users_settings
  where admin_id = new.admin_id;

  perform public.queue_email(
    'admin/account/new-device',
    v_email,
    jsonb_build_object(
      'name',    v_name,
      'model',   new.model,
      'os',      new.os::text,
      'ip',      new.ip,
      'city',    new.city,
      'country', new.country,
      'locale',  v_locale
    ),
    'account'
  );

  return new;
exception
  when others then
    raise warning '[notify_new_admin_device] error: %', sqlerrm;
    return new;
end;
$$;

create trigger on_new_admin_device_inserted
  after insert on public.internal_t__admin_users_devices
  for each row execute function notify_new_admin_device();