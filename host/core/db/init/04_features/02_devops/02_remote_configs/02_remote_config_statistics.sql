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

create table if not exists public.internal_t__remote_config_statistics (
  statistic_id      bigint  primary key generated always as identity,
  remote_config_id  bigint  not null references public.internal_t__remote_configs(remote_config_id) on delete cascade,
  user_id           uuid    references public.internal_t__app_users(user_id) on delete set null,
  audience          public.remote_config_audience not null default 'public',
  outcome           text    not null default 'served'
    check (outcome in ('served', 'unchanged')),
  created_at        bigint  not null
);

create index if not exists remote_config_statistics_remote_config_id_idx
  on public.internal_t__remote_config_statistics (remote_config_id, created_at);

create index if not exists remote_config_statistics_user_id_idx
  on public.internal_t__remote_config_statistics (user_id)
  where user_id is not null;

create index if not exists remote_config_statistics_audience_idx
  on public.internal_t__remote_config_statistics (remote_config_id, audience, outcome, created_at);

alter table public.internal_t__remote_config_statistics enable row level security;

revoke all on public.internal_t__remote_config_statistics from authenticated, anon;

create or replace function set_remote_config_statistic_defaults()
returns trigger as $$
begin
  new.created_at := extract(epoch from now()) * 1000;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger remote_config_statistics_set_defaults
  before insert on public.internal_t__remote_config_statistics
  for each row execute function set_remote_config_statistic_defaults();

create or replace function public.cleanup_remote_config_statistics()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.internal_t__remote_config_statistics
  where created_at < (extract(epoch from now() - interval '30 days') * 1000)::bigint;

  delete from public.internal_t__remote_config_statistics
  where statistic_id in (
    select statistic_id
    from public.internal_t__remote_config_statistics
    order by statistic_id desc
    offset 10000000
  );
end;
$$;

select cron.schedule(
  'cleanup-remote-config-statistics',
  '0 0 * * *',
  'select public.cleanup_remote_config_statistics()'
);
