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

create table if not exists public.internal_t__notification_push_opens (
  open_id     bigint primary key generated always as identity,
  push_id     bigint not null references public.internal_t__notification_pushes(push_id) on delete cascade,
  created_at  bigint not null
);

create index if not exists notification_push_opens_push_id_idx
  on public.internal_t__notification_push_opens (push_id, created_at);

alter table public.internal_t__notification_push_opens enable row level security;

revoke all on public.internal_t__notification_push_opens from authenticated, anon;

create or replace function set_notification_push_open_defaults()
returns trigger as $$
begin
  new.created_at := extract(epoch from now()) * 1000;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create trigger notification_push_opens_set_defaults
  before insert on public.internal_t__notification_push_opens
  for each row execute function set_notification_push_open_defaults();
