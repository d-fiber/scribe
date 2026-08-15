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

create table if not exists public.internal_t__dynamic_links (
  short_link_id   bigint      primary key generated always as identity,
  slug            text        not null unique,
  payload         jsonb       not null,
  user_id         uuid        references auth.users(id) on delete set null,
  created_at      bigint      not null,
  updated_at      bigint      not null,
  expires_at      bigint
);

create index if not exists dynamic_links_user_id_idx
  on public.internal_t__dynamic_links (user_id)
  where user_id is not null;

alter table public.internal_t__dynamic_links enable row level security;

revoke all on public.internal_t__dynamic_links from authenticated, anon;

create or replace function set_dynamic_link_defaults()
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

create trigger dynamic_links_set_defaults
  before insert or update on public.internal_t__dynamic_links
  for each row execute function set_dynamic_link_defaults();

create index if not exists dynamic_links_expires_at_idx
  on public.internal_t__dynamic_links (expires_at)
  where expires_at is not null;

select cron.schedule(
  'cleanup-expired-dynamic-links',
  '*/10 * * * *',
  'DELETE FROM public.internal_t__dynamic_links WHERE expires_at IS NOT NULL AND expires_at < (extract(epoch from now()) * 1000)::bigint'
);
