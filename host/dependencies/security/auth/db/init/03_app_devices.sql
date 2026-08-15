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

create table if not exists public.internal_t__app_user_devices (
  id                  uuid                          primary key default gen_random_uuid(),
  user_id             uuid                          not null references public.internal_t__app_users(user_id) on delete cascade,
  device_id           varchar(256)                  not null,
  client              public.client_type            not null,
  os                  public.device_os              not null,
  model               varchar(255)                  not null,
  app_version         text,
  is_physical_device  boolean                       not null,
  device_category     public.device_category        not null,
  hash                text,
  notification_token  text,
  ip                  varchar(45)                   not null,
  city                varchar(100)                  not null,
  country             varchar(100)                  not null,
  location            public.location_coordinate,
  created_at          bigint                        not null,
  updated_at          bigint                        not null,
  trusted_at          bigint                        not null default (extract(epoch from now()) * 1000)::bigint,

  unique (user_id, device_id)
);

-- Pas d'index sur (user_id) seul : la contrainte `unique (user_id, device_id)`
-- ci-dessus crée déjà un index composite dont le préfixe gauche sert les
-- recherches sur user_id. Un second index ne ferait qu'alourdir chaque
-- écriture. La requête chaude du chemin requête, `where user_id = $1 and
-- device_id = $2`, est servie par la contrainte.

alter table public.internal_t__app_user_devices enable row level security;

grant select on public.internal_t__app_user_devices to authenticated;

revoke insert, update, delete on public.internal_t__app_user_devices from authenticated, anon;

create policy "user_devices_select" on public.internal_t__app_user_devices
  for select using (auth.uid() = user_id);

create or replace function set_device_defaults()
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

create trigger user_devices_set_defaults
  before insert or update on public.internal_t__app_user_devices
  for each row execute function set_device_defaults();

create or replace function notify_new_device_inserted()
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
  if (select count(*) from public.internal_t__app_user_devices where user_id = new.user_id) <= 1 then
    return new;
  end if;

  select u.email
  into v_email
  from public.internal_t__app_users u
  where u.user_id = new.user_id;

  select
    case
      when up.use_preferred_name and up.preferred_name is not null and trim(up.preferred_name) <> ''
        then trim(up.preferred_name)
      else up.first_name
    end
  into v_name
  from public.app_user_profiles up
  where up.user_id = new.user_id;

  select us.localization::text
  into v_locale
  from public.internal_t__app_user_settings us
  where us.user_id = new.user_id;

  perform public.queue_email(
    'app/account/new-device',
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
    raise warning '[notify_new_device_inserted] error: %', sqlerrm;
    return new;
end;
$$;

create trigger on_new_device_inserted
  after insert on public.internal_t__app_user_devices
  for each row execute function notify_new_device_inserted();
