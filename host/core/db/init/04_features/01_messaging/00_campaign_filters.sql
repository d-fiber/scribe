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

create or replace function public.campaign_filter_user_device(p_user_id uuid, p_filters jsonb)
returns boolean
language sql
stable
as $$
  select
    (
      p_filters->>'device_os' is null
      and p_filters->>'app_version' is null
      and p_filters->>'app_version_min' is null
      and p_filters->>'app_version_max' is null
      and p_filters->>'country' is null
      and p_filters->'location' is null
    )
    or exists (
      select 1
      from public.internal_t__app_user_devices d
      where d.user_id = p_user_id
        and (p_filters->>'device_os' is null or d.os = (p_filters->>'device_os')::public.device_os)
        and (p_filters->>'app_version' is null or d.app_version = p_filters->>'app_version')
        and (
          p_filters->>'app_version_min' is null
          or parse_app_version(d.app_version) >= parse_app_version(p_filters->>'app_version_min')
        )
        and (
          p_filters->>'app_version_max' is null
          or parse_app_version(d.app_version) <= parse_app_version(p_filters->>'app_version_max')
        )
        and (p_filters->>'country' is null or d.country = p_filters->>'country')
        and (
          p_filters->'location' is null
          or (
            d.location is not null
            and haversine_km(
              (d.location).lat, (d.location).lng,
              (p_filters->'location'->>'lat')::double precision,
              (p_filters->'location'->>'lng')::double precision
            ) <= (p_filters->'location'->>'radius_km')::double precision
          )
        )
    );
$$;

create or replace function public.campaign_filter_user_localization(p_user_id uuid, p_filters jsonb)
returns boolean
language sql
stable
as $$
  select
    p_filters->>'localization' is null
    or exists (
      select 1
      from public.internal_t__app_user_settings us
      where us.user_id = p_user_id
        and us.localization = (p_filters->>'localization')::public.localization
    );
$$;

create or replace function public.campaign_filter_user_gender(p_user_id uuid, p_filters jsonb)
returns boolean
language sql
stable
as $$
  select
    p_filters->>'gender' is null
    or exists (
      select 1
      from public.app_user_profiles up
      where up.user_id = p_user_id
        and up.gender = (p_filters->>'gender')::public.gender
    );
$$;

-- No campaign_filter_admin_*: resolve_admin_campaign_audience() was
-- email_campaigns-only and was removed when email campaign audience
-- resolution moved to TypeScript (see scribe/host/client/src/features/
-- messagings/campaigns/). campaign_filter_user_*/campaign_filter_inactivity
-- below stay: still used by resolve_push_campaign_audience()/
-- resolve_in_app_notification_campaign_audience(), not yet migrated.

create or replace function public.campaign_filter_inactivity(p_id uuid, p_filters jsonb)
returns boolean
language sql
stable
as $$
  select
    p_filters->>'inactive_days' is null
    or exists (
      select 1
      from auth.users au
      where au.id = p_id
        and (
          au.last_sign_in_at is null
          or au.last_sign_in_at <= now() - ((p_filters->>'inactive_days')::int || ' days')::interval
        )
    );
$$;

create or replace function public.validate_campaign_filters(p_filters jsonb)
returns void
language plpgsql
stable
as $$
begin
  if p_filters is null then
    return;
  end if;

  begin
    perform (p_filters->>'device_os')::public.device_os;
  exception when others then
    raise exception 'filters.device_os invalide: %', p_filters->>'device_os';
  end;

  begin
    perform (p_filters->>'localization')::public.localization;
  exception when others then
    raise exception 'filters.localization invalide: %', p_filters->>'localization';
  end;

  begin
    perform (p_filters->>'gender')::public.gender;
  exception when others then
    raise exception 'filters.gender invalide: %', p_filters->>'gender';
  end;

  begin
    perform (p_filters->>'is_email_verified')::boolean;
  exception when others then
    raise exception 'filters.is_email_verified invalide: %', p_filters->>'is_email_verified';
  end;

  begin
    perform (p_filters->>'is_phone_verified')::boolean;
  exception when others then
    raise exception 'filters.is_phone_verified invalide: %', p_filters->>'is_phone_verified';
  end;

  begin
    perform (p_filters->>'created_after')::bigint;
  exception when others then
    raise exception 'filters.created_after invalide: %', p_filters->>'created_after';
  end;

  begin
    perform (p_filters->>'created_before')::bigint;
  exception when others then
    raise exception 'filters.created_before invalide: %', p_filters->>'created_before';
  end;

  begin
    perform (p_filters->>'inactive_days')::int;
  exception when others then
    raise exception 'filters.inactive_days invalide: %', p_filters->>'inactive_days';
  end;

  if p_filters->'location' is not null then
    begin
      perform (p_filters->'location'->>'lat')::double precision;
      perform (p_filters->'location'->>'lng')::double precision;
      perform (p_filters->'location'->>'radius_km')::double precision;
    exception when others then
      raise exception 'filters.location invalide: %', p_filters->'location';
    end;
  end if;
end;
$$;

create or replace function public.validate_campaign_filters_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.validate_campaign_filters(new.filters);
  return new;
end;
$$;
