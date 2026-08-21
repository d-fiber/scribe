-- Copyright (C) 2026 Fiber
--
-- This Source Code Form is subject to the terms of the Mozilla Public License,
-- v. 2.0. If a copy of the MPL was not distributed with this file, You can
-- obtain one at https://mozilla.org/MPL/2.0/.
--
-- What you may do:
-- - Use this software for any purpose, including commercially, and build and
--   sell your own products on top of it.
-- - Change it, and create new works based on it.
-- - Distribute copies of it, with or without your changes.
-- - Combine it with files under any other licence, proprietary ones included,
--   and licence that larger work on your own terms.
--
-- What you must do in return:
-- - Keep this notice on every file you received it on.
-- - Publish, under these same terms, the source of every file covered by them
--   that you distribute, including the ones you changed, so that whoever
--   receives your version can obtain that source.
-- - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
--   trademarks may not be used to endorse or promote what you build, and this
--   licence grants no right to them.
--
-- Disclaimer:
-- AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
-- OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
-- WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
-- NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
-- INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
-- LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
-- OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
-- KIND OF LEGAL CLAIM.
--
-- This header is a summary written for convenience. Where it differs from the
-- LICENSE file, the LICENSE file governs.

create table if not exists public.internal_t__push_campaigns (
  push_campaign_id  bigint  primary key generated always as identity,
  push_template_id  bigint  not null references public.internal_t__push_templates(push_template_id) on delete cascade,
  schedule_kind     text    not null check (schedule_kind in ('once', 'cron')),
  scheduled_at      bigint,
  cron_expression   text,
  schedule_timezone text    not null default 'UTC',
  next_run_at       bigint,
  last_run_at       bigint,
  filters           jsonb,
  is_active         boolean not null default true,
  created_at        bigint  not null,
  updated_at        bigint  not null,

  constraint push_campaigns_schedule_mode check (
    (schedule_kind = 'once' and scheduled_at is not null and cron_expression is null)
    or (schedule_kind = 'cron' and cron_expression is not null and scheduled_at is null)
  )
);

create index if not exists push_campaigns_due_idx
  on public.internal_t__push_campaigns (next_run_at)
  where is_active = true and next_run_at is not null;

alter table public.internal_t__push_campaigns enable row level security;

revoke all on public.internal_t__push_campaigns from authenticated, anon;

create trigger push_campaigns_set_timestamps
  before insert or update on public.internal_t__push_campaigns
  for each row execute function public.set_timestamps();

create trigger push_campaigns_validate_filters
  before insert or update on public.internal_t__push_campaigns
  for each row execute function validate_campaign_filters_trigger();

create or replace function public.cron_field_matches(p_field text, p_value integer, p_min integer, p_max integer)
returns boolean
language plpgsql
immutable
as $$
declare
  v_term  text;
  v_step  integer;
  v_range text;
  v_from  integer;
  v_to    integer;
begin
  foreach v_term in array string_to_array(p_field, ',') loop
    v_step  := 1;
    v_range := v_term;

    if position('/' in v_term) > 0 then
      v_range := split_part(v_term, '/', 1);
      v_step  := nullif(split_part(v_term, '/', 2), '')::integer;
      if v_step is null or v_step < 1 then return false; end if;
    end if;

    if v_range = '*' then
      v_from := p_min;
      v_to   := p_max;
    elsif position('-' in v_range) > 0 then
      v_from := split_part(v_range, '-', 1)::integer;
      v_to   := split_part(v_range, '-', 2)::integer;
    else
      v_from := v_range::integer;
      v_to   := case when v_step > 1 then p_max else v_from end;
    end if;

    if v_from < p_min or v_to > p_max or v_from > v_to then return false; end if;

    if p_value between v_from and v_to and (p_value - v_from) % v_step = 0 then
      return true;
    end if;
  end loop;

  return false;
exception
  when others then
    return false;
end;
$$;

create or replace function public.cron_matches(p_expression text, p_at timestamptz, p_timezone text)
returns boolean
language plpgsql
stable
as $$
declare
  v_fields text[] := regexp_split_to_array(btrim(p_expression), '\s+');
  v_local  timestamp;
  v_dow    integer;
begin
  if array_length(v_fields, 1) <> 5 then return false; end if;

  v_local := p_at at time zone p_timezone;
  v_dow   := extract(dow from v_local)::integer;

  return public.cron_field_matches(v_fields[1], extract(minute from v_local)::integer, 0, 59)
     and public.cron_field_matches(v_fields[2], extract(hour   from v_local)::integer, 0, 23)
     and public.cron_field_matches(v_fields[3], extract(day    from v_local)::integer, 1, 31)
     and public.cron_field_matches(v_fields[4], extract(month  from v_local)::integer, 1, 12)
     and (
       public.cron_field_matches(v_fields[5], v_dow, 0, 6)
       or (v_dow = 0 and public.cron_field_matches(v_fields[5], 7, 0, 7))
     );
exception
  when others then
    return false;
end;
$$;

-- Postgres has no next-occurrence primitive, and pg_cron does not expose its
-- own parser. The horizons escalate instead of scanning a full year up front:
-- almost every expression matches within two days, and only a yearly-style
-- expression pays for the 366-day scan. Set-based (generate_series + filter),
-- not a plpgsql minute loop, which would be an order of magnitude slower.
create or replace function public.next_cron_run(
  p_expression text,
  p_timezone   text,
  p_after      bigint
)
returns bigint
language plpgsql
stable
as $$
declare
  v_start   timestamptz := to_timestamp(p_after / 1000.0) + interval '1 minute';
  v_horizon interval;
  v_found   timestamptz;
begin
  if p_expression is null
     or array_length(regexp_split_to_array(btrim(p_expression), '\s+'), 1) <> 5
  then
    return null;
  end if;

  perform 1 from pg_timezone_names where name = p_timezone;
  if not found then
    raise warning '[next_cron_run] unknown timezone %, falling back to UTC', p_timezone;
    p_timezone := 'UTC';
  end if;

  foreach v_horizon in array array[interval '2 days', interval '40 days', interval '366 days'] loop
    select min(candidate) into v_found
    from generate_series(
           date_trunc('minute', v_start),
           date_trunc('minute', v_start + v_horizon),
           interval '1 minute'
         ) as candidate
    where public.cron_matches(p_expression, candidate, p_timezone);

    if v_found is not null then
      return (extract(epoch from v_found) * 1000)::bigint;
    end if;
  end loop;

  return null;
end;
$$;

create or replace function public.next_push_campaign_run(
  p_campaign public.internal_t__push_campaigns,
  p_after    bigint
)
returns bigint
language sql
stable
as $$
  select case
    when p_campaign.schedule_kind = 'once'
      then case when p_campaign.scheduled_at > p_after then p_campaign.scheduled_at end
    else public.next_cron_run(p_campaign.cron_expression, p_campaign.schedule_timezone, p_after)
  end;
$$;

create or replace function public.set_push_campaign_next_run()
returns trigger as $$
declare
  now_ms bigint := extract(epoch from now()) * 1000;
begin
  if tg_op = 'INSERT'
     or new.schedule_kind     is distinct from old.schedule_kind
     or new.scheduled_at      is distinct from old.scheduled_at
     or new.cron_expression   is distinct from old.cron_expression
     or new.schedule_timezone is distinct from old.schedule_timezone
  then
    new.next_run_at := public.next_push_campaign_run(new, now_ms);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger push_campaigns_set_next_run
  before insert or update on public.internal_t__push_campaigns
  for each row execute function public.set_push_campaign_next_run();

-- Shared by run_due_push_campaigns() and by the TypeScript client (RPC), so
-- that "what happens after a run" has a single definition: advance the
-- schedule, and deactivate whatever has no next occurrence left.
create or replace function public.mark_push_campaign_ran(
  p_campaign_id bigint,
  p_ran_at      bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.internal_t__push_campaigns%rowtype;
  v_next     bigint;
begin
  select * into v_campaign
  from public.internal_t__push_campaigns
  where push_campaign_id = p_campaign_id;

  if not found then return false; end if;

  v_next := public.next_push_campaign_run(v_campaign, p_ran_at);

  update public.internal_t__push_campaigns
  set last_run_at = p_ran_at,
      next_run_at = v_next,
      is_active   = v_next is not null
  where push_campaign_id = p_campaign_id;

  return true;
end;
$$;

create or replace function resolve_push_campaign_audience(p_filters jsonb)
returns table(user_id uuid)
language sql
security definer
set search_path = public
as $$
  select u.user_id
  from public.internal_t__app_users u
  where exists (
      select 1
      from public.internal_t__app_user_devices d
      where d.user_id = u.user_id
        and d.notification_token is not null
    )
    and exists (
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

create or replace function run_due_push_campaigns()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign      public.internal_t__push_campaigns%rowtype;
  v_template_name text;
  v_now_ms        bigint := extract(epoch from now()) * 1000;
  v_lock_key      constant bigint := hashtext('run_due_push_campaigns')::bigint;
begin
  if not pg_try_advisory_lock(v_lock_key) then
    raise warning '[run_due_push_campaigns] previous run still in progress, skipping tick';
    return;
  end if;

  for v_campaign in
    select *
    from public.internal_t__push_campaigns
    where is_active = true
      and next_run_at is not null
      and next_run_at <= v_now_ms
    order by next_run_at
  loop
    begin
      select name into v_template_name
      from public.internal_t__push_templates
      where push_template_id = v_campaign.push_template_id;

      if v_template_name is not null then
        insert into public.internal_t__in_app_notifications (user_id, type)
        select a.user_id, v_template_name
        from resolve_push_campaign_audience(coalesce(v_campaign.filters, '{}'::jsonb)) a;
      end if;

      perform public.mark_push_campaign_ran(v_campaign.push_campaign_id, v_now_ms);
    exception
      when others then
        raise warning '[run_due_push_campaigns] campaign % failed: %', v_campaign.push_campaign_id, sqlerrm;
    end;
  end loop;

  perform pg_advisory_unlock(v_lock_key);
exception
  when others then
    perform pg_advisory_unlock(v_lock_key);
    raise warning '[run_due_push_campaigns] error: %', sqlerrm;
end;
$$;

select cron.schedule(
  'run-due-push-campaigns',
  '*/10 * * * *',
  'select public.run_due_push_campaigns()'
);
