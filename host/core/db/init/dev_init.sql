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

create extension if not exists pgcrypto;

create or replace function dev_create_admin(
  p_email         text,
  p_password      text,
  p_phone         text,
  p_first_name    text,
  p_last_name     text,
  p_gender        public.gender,
  p_birthday      bigint,
  p_role          text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid             uuid        := gen_random_uuid();
  v_now             timestamptz := now();
  v_now_ms          bigint      := extract(epoch from v_now) * 1000;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, created_at, updated_at
  ) values (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
    '{}'::jsonb,
    '', '', v_now, v_now
  );

  insert into public.internal_t__admin_users (
    admin_id, role, email, is_email_verified,
    phone, is_phone_verified,
    created_at, updated_at
  ) values (
    v_uid, p_role, p_email, true,
    p_phone, false,
    v_now_ms, v_now_ms
  );

  insert into public.internal_t__admin_users_profiles (
    admin_id, avatar_type, avatar_text, avatar_background_color,
    first_name, last_name, gender, birthday
  ) values (
    v_uid, 'text',
    upper(left(p_first_name, 1)) || upper(left(p_last_name, 1)),
    'FA062B',
    p_first_name, p_last_name, p_gender, p_birthday
  );

  insert into public.internal_t__admin_users_settings (admin_id, localization, theme_mode)
  values (v_uid, 'french', 'system');

  return v_uid;
end;
$$;

create or replace function dev_create_user(
  p_email       text,
  p_password    text,
  p_first_name  text,
  p_last_name   text,
  p_gender      public.gender,
  p_birthday    bigint,
  p_city        text,
  p_districts   int[]
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid    uuid        := gen_random_uuid();
  v_now    timestamptz := now();
  v_now_ms bigint      := extract(epoch from v_now) * 1000;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, created_at, updated_at
  ) values (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '', '', v_now, v_now
  );

  insert into public.internal_t__app_users (user_id, email, is_email_verified, phone, created_at, updated_at)
  values (v_uid, p_email, true, null, v_now_ms, v_now_ms);

  insert into public.app_user_profiles (
    user_id, avatar_type, avatar_text, avatar_background_color,
    first_name, last_name, preferred_name, use_preferred_name, gender, birthday
  ) values (
    v_uid, 'text',
    upper(left(p_first_name, 1)) || upper(left(p_last_name, 1)),
    'FA062B',
    p_first_name, p_last_name, null, false, p_gender, p_birthday
  );

  insert into public.internal_t__app_user_settings (
    user_id,
    notif_display, notif_sound, notif_vibrations, notif_reminders,
    has_shake_report,
    themes, localization, theme_mode
  ) values (
    v_uid,
    true, 'pure_tone', true, true,
    false,
    array['fashion','accessories','beauty','wellness','lifestyle','culture','food','sport','tech','home','gaming','music','eco_friendly','dressing']::public.theme[],
    'french', 'system'
  );

  insert into public.app_user_locations (
    user_id, city, districts, is_active, location, created_at, updated_at
  ) values (
    v_uid, p_city, p_districts, true, null, v_now_ms, v_now_ms
  );

  return v_uid;
end;
$$;

do $$
declare
  admin_id1 uuid;
begin

  admin_id1 := dev_create_admin(
    p_email      => 'larsanov.inc@gmail.com',
    p_password   => 'Ink954-11--@@',
    p_phone      => '+33652951531',
    p_first_name => 'Ismail',
    p_last_name  => 'Larsanov',
    p_gender     => 'male',
    p_birthday   => extract(epoch from '1997-12-16'::date)::bigint * 1000
  );

  admin_id1 := dev_create_admin(
    p_email      => 'tiffanygarcin@gmail.com',
    p_password   => 'Azertyuiop11--@@',
    p_phone      => '+33600000000',
    p_first_name => 'Tiffany',
    p_last_name  => 'Garcin',
    p_gender     => 'female',
    p_birthday   => extract(epoch from '1996-09-06'::date)::bigint * 1000
  );

  admin_id1 := dev_create_admin(
    p_email      => 'amel.neffati@gmail.com',
    p_password   => 'Azertyuiop11--@@',
    p_phone      => '+33600000000',
    p_first_name => 'Amel',
    p_last_name  => 'Neffati',
    p_gender     => 'female',
    p_birthday   => extract(epoch from '1996-08-17'::date)::bigint * 1000
  );

end;
$$;
