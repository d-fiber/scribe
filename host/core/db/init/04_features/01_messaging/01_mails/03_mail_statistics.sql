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

create table if not exists public.internal_t__mail_statistics (
  statistic_id        bigint primary key generated always as identity,
  mail_id             bigint not null references public.internal_t__mails(mail_id) on delete cascade,
  created_at          bigint not null,
  ip_address          inet,
  user_agent          text
);

create index if not exists mail_statistics_mail_id_idx
  on public.internal_t__mail_statistics (mail_id, created_at);

alter table public.internal_t__mail_statistics enable row level security;

revoke all on public.internal_t__mail_statistics from authenticated, anon;

create trigger mail_statistics_set_created_at
  before insert on public.internal_t__mail_statistics
  for each row execute function public.set_created_at();

create or replace function public.cleanup_mail_statistics()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c_max_age_days constant int    := 30;
  c_max_rows     constant bigint := 10000000;
begin
  delete from public.internal_t__mail_statistics
  where created_at < (extract(epoch from now() - make_interval(days => c_max_age_days)) * 1000)::bigint;

  delete from public.internal_t__mail_statistics
  where statistic_id in (
    select statistic_id
    from public.internal_t__mail_statistics
    order by statistic_id desc
    offset c_max_rows
  );
end;
$$;

select cron.schedule(
  'cleanup-mail-statistics',
  '0 0 * * *',
  'select public.cleanup_mail_statistics()'
);
