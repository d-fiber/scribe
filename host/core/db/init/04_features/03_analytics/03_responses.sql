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

create table if not exists public.internal_t__responses (
  response_id   uuid    primary key default gen_random_uuid(),
  target_type   text    not null,
  target_id     uuid    not null,
  admin_id      uuid    references public.internal_t__admin_users(admin_id) on delete set null,
  message       text,
  responded_at  bigint  not null,
  updated_at    bigint  not null
);

create index on public.internal_t__responses (target_type, target_id, responded_at desc);

alter table public.internal_t__responses enable row level security;

grant select on public.internal_t__responses to authenticated;

revoke insert, update, delete on public.internal_t__responses from authenticated, anon;

create policy "responses_select_issues_feedback" on public.internal_t__responses
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (
      target_type = 'issue' and exists (
        select 1 from public.internal_t__app_user_issue_reports r
        where r.issue_id = responses.target_id and r.user_id = auth.uid()
      )
    )
    or (
      target_type = 'feedback' and exists (
        select 1 from public.internal_t__app_user_feedback f
        where f.feedback_id = responses.target_id and f.user_id = auth.uid()
      )
    )
  );

create or replace function set_responses_defaults()
returns trigger as $$
declare
  now_ms bigint := extract(epoch from now()) * 1000;
begin
  if tg_op = 'INSERT' then
    new.responded_at := now_ms;
    new.updated_at := now_ms;
  else
    new.updated_at := now_ms;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger responses_set_defaults
  before insert or update on public.internal_t__responses
  for each row execute function set_responses_defaults();
