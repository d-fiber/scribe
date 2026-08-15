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

create table if not exists public.internal_t__admin_users_profiles (
  admin_id                 uuid                   primary key references public.internal_t__admin_users(admin_id) on delete cascade,
  avatar_type              public.avatar_type     not null,
  avatar_url               text,
  avatar_blur_hash         text,
  avatar_text              text,
  avatar_background_color  text,
  avatar_placeholder       text,
  first_name               varchar(100)           not null,
  last_name                varchar(100)           not null,
  gender                   public.gender          not null,
  birthday                 bigint                 not null
);

alter table public.internal_t__admin_users_profiles enable row level security;
alter table public.internal_t__admin_users_profiles force row level security;

grant select, update on public.internal_t__admin_users_profiles to authenticated;

revoke insert, delete on public.internal_t__admin_users_profiles from authenticated, anon;

create policy "admin_profiles_policy" on public.internal_t__admin_users_profiles
  for all
  using (auth.uid() = admin_id and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (auth.uid() = admin_id and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
