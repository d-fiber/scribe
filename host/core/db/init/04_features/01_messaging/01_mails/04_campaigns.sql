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

create table if not exists public.internal_t__email_campaigns (
  email_campaign_id  bigint  primary key generated always as identity,
  email_template_id  bigint  not null references public.internal_t__email_templates(email_template_id) on delete cascade,
  audience           public.campaign_audience not null default 'user',
  schedule_kind      text    not null check (schedule_kind in ('once', 'cron')),
  scheduled_at       bigint,
  cron_expression    text,
  schedule_timezone  text    not null default 'UTC',
  next_run_at        bigint,
  last_run_at        bigint,
  filters            jsonb,
  data               jsonb,
  is_active          boolean not null default true,
  created_at         bigint  not null,
  updated_at         bigint  not null,

  constraint email_campaigns_schedule_mode check (
    (schedule_kind = 'once' and scheduled_at is not null and cron_expression is null)
    or (schedule_kind = 'cron' and cron_expression is not null and scheduled_at is null)
  )
);

create index if not exists email_campaigns_due_idx
  on public.internal_t__email_campaigns (next_run_at)
  where is_active = true and next_run_at is not null;

alter table public.internal_t__email_campaigns enable row level security;

revoke all on public.internal_t__email_campaigns from authenticated, anon;

create trigger email_campaigns_set_timestamps
  before insert or update on public.internal_t__email_campaigns
  for each row execute function public.set_timestamps();
