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

create table if not exists public.internal_t__app_user_settings (
  user_id           uuid                       primary key references public.internal_t__app_users(user_id) on delete cascade,
  localization      public.localization        not null,
  theme_mode        public.device_theme_mode   not null
);

alter table public.internal_t__app_user_settings enable row level security;

grant select, update, delete on public.internal_t__app_user_settings to authenticated;

revoke insert on public.internal_t__app_user_settings from authenticated, anon;

create policy "user_settings_policy" on public.internal_t__app_user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_settings_delete" on public.internal_t__app_user_settings
  for delete using (
    auth.uid() = user_id
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
