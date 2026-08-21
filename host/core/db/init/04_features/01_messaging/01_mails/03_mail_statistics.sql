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
