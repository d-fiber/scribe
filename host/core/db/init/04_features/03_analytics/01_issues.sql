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

create table if not exists public.internal_t__app_user_issue_reports (
  issue_id      uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null references public.internal_t__app_users(user_id) on delete cascade,
  screen_url    text    not null,
  log_file_url  text,
  message       text,
  created_at    bigint  not null,
  updated_at    bigint  not null
);

create index on public.internal_t__app_user_issue_reports (user_id, created_at desc);

alter table public.internal_t__app_user_issue_reports enable row level security;
alter table public.internal_t__app_user_issue_reports force row level security;

grant select, insert, delete, update on public.internal_t__app_user_issue_reports to authenticated;

create policy "user_issue_reports_select" on public.internal_t__app_user_issue_reports
  for select using (auth.uid() = user_id);

create policy "user_issue_reports_insert" on public.internal_t__app_user_issue_reports
  for insert with check (auth.uid() = user_id);

create policy "user_issue_reports_delete" on public.internal_t__app_user_issue_reports
  for delete using (auth.uid() = user_id);

create policy "user_issue_reports_update" on public.internal_t__app_user_issue_reports
  for update using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function set_user_issue_defaults()
returns trigger as $$
declare
  now_ms bigint := extract(epoch from now()) * 1000;
begin
  if tg_op = 'INSERT' then
    new.user_id    := coalesce(new.user_id, auth.uid());
    new.created_at := now_ms;
    new.updated_at := now_ms;
  else
    new.updated_at := now_ms;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger user_issue_reports_set_defaults
  before insert or update on public.internal_t__app_user_issue_reports
  for each row execute function set_user_issue_defaults();