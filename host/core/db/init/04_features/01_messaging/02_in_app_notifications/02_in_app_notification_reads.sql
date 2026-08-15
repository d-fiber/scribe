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

create table if not exists public.internal_t__in_app_notification_reads (
  user_id       uuid    primary key references public.internal_t__app_users(user_id) on delete cascade,
  last_read_at  bigint  not null
);

alter table public.internal_t__in_app_notification_reads enable row level security;
alter table public.internal_t__in_app_notification_reads force row level security;

grant select on public.internal_t__in_app_notification_reads to authenticated;

revoke insert, update, delete on public.internal_t__in_app_notification_reads from authenticated, anon;

create policy "in_app_notification_reads_select" on public.internal_t__in_app_notification_reads
  for select using (auth.uid() = user_id);

create or replace function mark_in_app_notifications_read()
returns void as $$
  insert into public.internal_t__in_app_notification_reads (user_id, last_read_at)
  values (auth.uid(), extract(epoch from now()) * 1000)
  on conflict (user_id) do update
    set last_read_at = excluded.last_read_at;
$$ language sql security definer set search_path = public;

grant execute on function mark_in_app_notifications_read() to authenticated;
