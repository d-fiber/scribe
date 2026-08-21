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

create table if not exists public.internal_t__notification_pushes (
  push_id          bigint primary key generated always as identity,
  notification_id  uuid   not null references public.internal_t__in_app_notifications(notification_id) on delete cascade,
  device_id        uuid   not null references public.internal_t__app_user_devices(id) on delete cascade,
  status           text   not null check (status in ('sent', 'failed')),
  error            text,
  created_at       bigint not null,
  updated_at       bigint not null
);

create index if not exists notification_pushes_notification_id_idx
  on public.internal_t__notification_pushes (notification_id);

create index if not exists notification_pushes_device_id_idx
  on public.internal_t__notification_pushes (device_id, created_at);

alter table public.internal_t__notification_pushes enable row level security;

revoke all on public.internal_t__notification_pushes from authenticated, anon;

create or replace function set_notification_push_defaults()
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

create trigger notification_pushes_set_defaults
  before insert or update on public.internal_t__notification_pushes
  for each row execute function set_notification_push_defaults();
