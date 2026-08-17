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

create table if not exists public.internal_t__push_templates (
  push_template_id  bigint primary key generated always as identity,
  name              text   not null unique,
  title             text   not null,
  body              text   not null,
  data              jsonb
);

alter table public.internal_t__push_templates enable row level security;

revoke all on public.internal_t__push_templates from authenticated, anon;

-- name is carried as it stands into internal_t__in_app_notifications.type,
-- which is free text with neither a foreign key nor an enum. Adding a template
-- here is therefore enough, and nothing else has to be kept in step.
insert into public.internal_t__push_templates (name, title, body, data) values
  (
    'welcome',
    'Bienvenue sur Poppin',
    'Découvre les meilleurs bons plans près de chez toi.',
    jsonb_build_object('type', 'welcome')
  )
on conflict (name) do nothing;
