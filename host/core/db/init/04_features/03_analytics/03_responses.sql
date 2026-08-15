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
