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

create table if not exists public.internal_t__app_users (
  user_id            uuid     primary key references auth.users(id) on delete cascade,
  email              varchar,
  is_email_verified  boolean  not null default false,
  phone              varchar,
  is_phone_verified  boolean  not null default false,
  social_provider    public.social_provider,
  created_at         bigint   not null,
  updated_at         bigint   not null,
  constraint app_users_identity_channel check (
    email is not null or phone is not null or social_provider is not null
  )
);

create unique index if not exists app_users_email_unique
  on public.internal_t__app_users (email) where email is not null;

create unique index if not exists app_users_phone_unique
  on public.internal_t__app_users (phone) where phone is not null;

alter table public.internal_t__app_users enable row level security;

grant select, delete on public.internal_t__app_users to authenticated;
grant update (phone) on public.internal_t__app_users to authenticated;

revoke insert on public.internal_t__app_users from authenticated, anon;
revoke update on public.internal_t__app_users from anon;

create policy "users_select" on public.internal_t__app_users
  for select using (auth.uid() = user_id);

create policy "users_update" on public.internal_t__app_users
  for update using (auth.uid() = user_id)
  with check (
    user_id           = auth.uid()
    and email             is not distinct from (select email             from public.internal_t__app_users where user_id = auth.uid())
    and is_email_verified = (select is_email_verified from public.internal_t__app_users where user_id = auth.uid())
    and is_phone_verified = (select is_phone_verified from public.internal_t__app_users where user_id = auth.uid())
    and social_provider   is not distinct from (select social_provider   from public.internal_t__app_users where user_id = auth.uid())
    and created_at        = (select created_at        from public.internal_t__app_users where user_id = auth.uid())
  );

create policy "users_delete" on public.internal_t__app_users
  for delete using (
    auth.uid() = user_id
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create or replace function set_user_defaults()
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

create trigger users_set_defaults
  before insert or update on public.internal_t__app_users
  for each row execute function set_user_defaults();

create or replace function sync_user_fields()
returns trigger as $$
begin
  update public.internal_t__app_users set
    email             = new.email,
    is_email_verified = new.email_confirmed_at is not null,
    phone             = new.phone,
    is_phone_verified = new.phone_confirmed_at is not null
  where user_id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_user_updated
  after update on auth.users
  for each row execute function sync_user_fields();

create or replace function notify_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name     text;
  v_locale   text;
  v_is_admin boolean := coalesce(old.raw_app_meta_data->>'role', '') = 'admin';
begin
  if v_is_admin then
    select up.first_name
    into v_name
    from public.internal_t__admin_users_profiles up
    where up.admin_id = old.id;

    select us.localization::text
    into v_locale
    from public.internal_t__admin_users_settings us
    where us.admin_id = old.id;
  else
    select
      case
        when up.use_preferred_name and up.preferred_name is not null and trim(up.preferred_name) <> ''
          then trim(up.preferred_name)
        else up.first_name
      end
    into v_name
    from public.app_user_profiles up
    where up.user_id = old.id;

    select us.localization::text
    into v_locale
    from public.internal_t__app_user_settings us
    where us.user_id = old.id;
  end if;

  if auth.uid() = old.id and old.email is not null then
    perform public.queue_email(
      case when v_is_admin then 'admin/account/delete-account' else 'app/account/delete-account' end,
      old.email,
      jsonb_build_object(
        'name',   v_name,
        'email',  old.email,
        'locale', v_locale
      ),
      'account'
    );
  end if;

  return old;
exception
  when others then
    raise warning '[notify_user_deleted] error: %', sqlerrm;
    return old;
end;
$$;

create trigger on_user_deleted
  before delete on auth.users
  for each row
  execute function notify_user_deleted();

create or replace function public.delete_unconfirmed_app_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cutoff  bigint := (extract(epoch from now()) * 1000)::bigint - (15 * 86400000);
begin
  for v_user_id in
    select u.user_id
    from public.internal_t__app_users u
    where u.social_provider is null
      and u.is_email_verified = false
      and u.is_phone_verified = false
      and u.created_at < v_cutoff
  loop
    delete from auth.users where id = v_user_id;
  end loop;
end;
$$;

select cron.schedule(
  'delete-unconfirmed-app-users',
  '0 0 * * *',
  'select public.delete_unconfirmed_app_users()'
);
