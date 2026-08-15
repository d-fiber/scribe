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

create table if not exists public.internal_t__in_app_notification_campaigns (
  notification_campaign_id  bigint  primary key generated always as identity,
  notification_template_id  bigint  not null references public.internal_t__in_app_notification_templates(notification_template_id) on delete cascade,
  frequency_hours           integer check (frequency_hours > 0),
  scheduled_at              bigint,
  filters                   jsonb,
  is_active                 boolean not null default true,
  last_run_at               bigint,
  created_at                bigint  not null,
  updated_at                bigint  not null,

  constraint in_app_notification_campaigns_schedule_mode check (
    (frequency_hours is not null) <> (scheduled_at is not null)
  )
);

create index if not exists in_app_notification_campaigns_active_idx
  on public.internal_t__in_app_notification_campaigns (is_active) where is_active = true;

alter table public.internal_t__in_app_notification_campaigns enable row level security;

revoke all on public.internal_t__in_app_notification_campaigns from authenticated, anon;

create or replace function set_in_app_notification_campaign_defaults()
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

create trigger in_app_notification_campaigns_set_defaults
  before insert or update on public.internal_t__in_app_notification_campaigns
  for each row execute function set_in_app_notification_campaign_defaults();

create trigger in_app_notification_campaigns_validate_filters
  before insert or update on public.internal_t__in_app_notification_campaigns
  for each row execute function validate_campaign_filters_trigger();

-- Même filtres que resolve_push_campaign_audience() (push_campaigns.sql),
-- sans l'exigence d'un notification_token FCM : une notification in-app
-- n'a pas besoin qu'un device soit enregistré pour le push.
create or replace function resolve_in_app_notification_campaign_audience(p_filters jsonb)
returns table(user_id uuid)
language sql
security definer
set search_path = public
as $$
  select u.user_id
  from public.internal_t__app_users u
  where exists (
      select 1
      from public.internal_t__app_user_settings us2
      where us2.user_id = u.user_id
        and us2.notif_display = true
    )
    and campaign_filter_user_device(u.user_id, p_filters)
    and campaign_filter_user_localization(u.user_id, p_filters)
    and campaign_filter_user_gender(u.user_id, p_filters)
    and (
      p_filters->>'is_email_verified' is null
      or u.is_email_verified = (p_filters->>'is_email_verified')::boolean
    )
    and (
      p_filters->>'is_phone_verified' is null
      or u.is_phone_verified = (p_filters->>'is_phone_verified')::boolean
    )
    and (
      p_filters->>'created_after' is null
      or u.created_at >= (p_filters->>'created_after')::bigint
    )
    and (
      p_filters->>'created_before' is null
      or u.created_at <= (p_filters->>'created_before')::bigint
    )
    and campaign_filter_inactivity(u.user_id, p_filters)
    and project_campaign_filter(u.user_id, p_filters);
$$;

create or replace function run_due_in_app_notification_campaigns()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign      record;
  v_template_name text;
  v_now_ms        bigint := extract(epoch from now()) * 1000;
  v_lock_key      constant bigint := hashtext('run_due_in_app_notification_campaigns')::bigint;
begin
  if not pg_try_advisory_lock(v_lock_key) then
    raise warning '[run_due_in_app_notification_campaigns] previous run still in progress, skipping tick';
    return;
  end if;

  for v_campaign in
    select *
    from public.internal_t__in_app_notification_campaigns
    where is_active = true
      and (
        (scheduled_at is not null and last_run_at is null and v_now_ms >= scheduled_at)
        or (
          frequency_hours is not null
          and (last_run_at is null or v_now_ms - last_run_at >= frequency_hours * 3600000)
        )
      )
  loop
    begin
      select name into v_template_name
      from public.internal_t__in_app_notification_templates
      where notification_template_id = v_campaign.notification_template_id;

      if v_template_name is not null then
        insert into public.internal_t__in_app_notifications (user_id, type)
        select a.user_id, v_template_name
        from resolve_in_app_notification_campaign_audience(coalesce(v_campaign.filters, '{}'::jsonb)) a;
      end if;

      update public.internal_t__in_app_notification_campaigns
      set last_run_at = v_now_ms,
          is_active = (v_campaign.scheduled_at is null)
      where notification_campaign_id = v_campaign.notification_campaign_id;
    exception
      when others then
        raise warning '[run_due_in_app_notification_campaigns] campaign % failed: %', v_campaign.notification_campaign_id, sqlerrm;
    end;
  end loop;

  perform pg_advisory_unlock(v_lock_key);
exception
  when others then
    perform pg_advisory_unlock(v_lock_key);
    raise warning '[run_due_in_app_notification_campaigns] error: %', sqlerrm;
end;
$$;

select cron.schedule(
  'run-due-in-app-notification-campaigns',
  '*/10 * * * *',
  'select public.run_due_in_app_notification_campaigns()'
);
