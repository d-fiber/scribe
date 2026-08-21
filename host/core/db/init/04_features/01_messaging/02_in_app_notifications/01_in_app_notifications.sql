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

create table if not exists public.internal_t__in_app_notifications (
  notification_id  uuid    primary key default gen_random_uuid(),
  user_id          uuid    not null references public.internal_t__app_users(user_id) on delete cascade,
  type             text    not null,
  created_at       bigint  not null,
  opened_at        bigint
);

create index on public.internal_t__in_app_notifications (user_id, created_at desc);

alter table public.internal_t__in_app_notifications enable row level security;
alter table public.internal_t__in_app_notifications force row level security;

grant select, delete on public.internal_t__in_app_notifications to authenticated;

grant update(opened_at) on public.internal_t__in_app_notifications to authenticated;

create policy "in_app_notifications_select" on public.internal_t__in_app_notifications
  for select using (auth.uid() = user_id);

create policy "in_app_notifications_insert" on public.internal_t__in_app_notifications
  for insert with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "in_app_notifications_update" on public.internal_t__in_app_notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "in_app_notifications_delete" on public.internal_t__in_app_notifications
  for delete using (auth.uid() = user_id);

create or replace function set_in_app_notification_defaults()
returns trigger as $$
begin
  new.created_at := extract(epoch from now()) * 1000;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger in_app_notifications_set_defaults
  before insert on public.internal_t__in_app_notifications
  for each row execute function set_in_app_notification_defaults();

create or replace function cap_in_app_notifications()
returns trigger as $$
begin
  delete from public.internal_t__in_app_notifications
  where user_id = new.user_id
    and notification_id not in (
      select notification_id
      from public.internal_t__in_app_notifications
      where user_id = new.user_id
      order by created_at desc
      limit 300
    );
  return null;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger in_app_notifications_cap
  after insert on public.internal_t__in_app_notifications
  for each row execute function cap_in_app_notifications();

create or replace function notify_in_app_notification_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  v_secret := current_setting('app.settings.internal_secret', true);

  perform net.http_post(
    url     := coalesce(current_setting('app.settings.api_url', true), 'http://api:3000') || '/messaging/push/send',
    body    := jsonb_build_object(
      'notification_id', new.notification_id,
      'type',            new.type::text
    ),
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-internal-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
exception
  when others then
    raise warning '[notify_in_app_notification_inserted] error: %', sqlerrm;
    return new;
end;
$$;

create trigger on_in_app_notification_inserted
  after insert on public.internal_t__in_app_notifications
  for each row execute function notify_in_app_notification_inserted();
