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

create type public.gender as enum (
  'male',
  'female',
  'prefer_not_to_say'
);

create type public.localization as enum (
  'english',
  'french'
);

create type public.avatar_type as enum (
  'photo',
  'text',
  'placeholder'
);

create type public.device_os as enum (
  'android',
  'ios',
  'linux',
  'macos',
  'windows',
  'unknown'
);

create type public.device_category as enum (
  'phone',
  'tablet',
  'desktop',
  'unknown'
);

create type public.client_type as enum (
  'app',
  'web',
  'soft'
);

create type public.device_theme_mode as enum (
  'system',
  'light',
  'dark'
);

create type public.feedback_type as enum (
  'very_satisfied',
  'slightly_satisfied',
  'neutral',
  'slightly_dissatisfied',
  'very_dissatisfied'
);

create type public.campaign_audience as enum (
  'user',
  'admin'
);

create type public.remote_config_audience as enum (
  'public',
  'authenticated',
  'user',
  'admin'
);

create type public.social_provider as enum (
  'google',
  'apple'
);


