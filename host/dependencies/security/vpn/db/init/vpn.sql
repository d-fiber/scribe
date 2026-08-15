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

create table if not exists public.internal_t__admin_users_vpn (
  admin_id        uuid    primary key references public.internal_t__admin_users(admin_id) on delete cascade,
  vpn_client_id   text    not null,
  vpn_expires_at  bigint  not null,
  vpn_is_active   boolean not null default false,
  created_at      bigint  not null,
  updated_at      bigint  not null
);

alter table public.internal_t__admin_users_vpn enable row level security;
alter table public.internal_t__admin_users_vpn force row level security;

grant select on public.internal_t__admin_users_vpn to authenticated;

revoke insert, update, delete on public.internal_t__admin_users_vpn from authenticated, anon;

create policy "admin_users_vpn_select" on public.internal_t__admin_users_vpn
  for select using (
    auth.uid() = admin_id
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create or replace function set_admin_user_vpn_defaults()
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

create trigger admin_users_vpn_set_defaults
  before insert or update on public.internal_t__admin_users_vpn
  for each row execute function set_admin_user_vpn_defaults();

create or replace function notify_vpn_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text := current_setting('app.settings.internal_secret', true);
begin
  perform net.http_post(
    url     := coalesce(current_setting('app.settings.functions_url', true), 'http://functions:9000') || '/vpn/create',
    body    := jsonb_build_object(
      'admin_id',   new.admin_id::text,
      'recipient',  coalesce(new.email, '')
    ),
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-internal-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );
  return new;
exception
  when others then
    raise warning '[notify_vpn_create] error: %', sqlerrm;
    return new;
end;
$$;

create trigger on_admin_user_inserted_vpn_create
  after insert on public.internal_t__admin_users
  for each row execute function notify_vpn_create();

create or replace function notify_vpn_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text := current_setting('app.settings.internal_secret', true);
begin
  perform net.http_post(
    url     := coalesce(current_setting('app.settings.functions_url', true), 'http://functions:9000') || '/vpn/delete',
    body    := jsonb_build_object(
      'admin_id',      old.admin_id::text,
      'vpn_client_id', old.vpn_client_id
    ),
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-internal-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );
  return old;
exception
  when others then
    raise warning '[notify_vpn_delete] error: %', sqlerrm;
    return old;
end;
$$;

create trigger on_admin_user_vpn_deleted
  after delete on public.internal_t__admin_users_vpn
  for each row execute function notify_vpn_delete();

create or replace function public.expire_vpn_configs()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin  record;
  v_secret text := current_setting('app.settings.internal_secret', true);
begin
  for v_admin in
    select a.admin_id
    from public.internal_t__admin_users a
    join public.internal_t__admin_users_vpn v on v.admin_id = a.admin_id
    where v.vpn_is_active = true
      and v.vpn_expires_at < (extract(epoch from now()) * 1000)::bigint
  loop
    perform net.http_post(
      url     := coalesce(current_setting('app.settings.functions_url', true), 'http://functions:9000') || '/vpn/expire',
      body    := jsonb_build_object(
        'admin_id', v_admin.admin_id::text
      ),
      headers := jsonb_build_object(
        'Content-Type',      'application/json',
        'x-internal-secret', v_secret
      ),
      timeout_milliseconds := 10000
    );
  end loop;
end;
$$;

select cron.schedule(
  'expire-vpn-configs',
  '0 0 * * *',
  'select public.expire_vpn_configs()'
);

create or replace function public.remind_vpn_configs()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin  record;
begin
  for v_admin in
    select
      a.admin_id,
      a.email,
      coalesce(s.localization::text, 'english') as locale,
      floor((v.vpn_expires_at - (extract(epoch from now()) * 1000)::bigint) / 86400000)::int as days_remaining
    from public.internal_t__admin_users a
    join public.internal_t__admin_users_vpn v on v.admin_id = a.admin_id
    left join public.internal_t__admin_users_settings s on s.admin_id = a.admin_id
    where v.vpn_is_active = true
      and floor((v.vpn_expires_at - (extract(epoch from now()) * 1000)::bigint) / 86400000)::int = any(array[6, 5, 4, 3, 2, 1])
  loop
    perform public.queue_email(
      'admin/account/vpn-expiry-reminder',
      v_admin.email,
      jsonb_build_object(
        'email',         v_admin.email,
        'days_remaining', v_admin.days_remaining,
        'locale',        v_admin.locale
      ),
      'noreply'
    );
  end loop;
end;
$$;

select cron.schedule(
  'remind-vpn-configs',
  '0 0 * * *',
  'select public.remind_vpn_configs()'
);
