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

create or replace function public.set_timestamps()
returns trigger as $$
declare
  now_ms bigint := extract(epoch from now()) * 1000;
begin
  if tg_op = 'INSERT' then
    new.created_at := now_ms;
  end if;
  new.updated_at := now_ms;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function public.set_created_at()
returns trigger as $$
begin
  new.created_at := extract(epoch from now()) * 1000;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function public.call_internal_api(p_path text, p_body jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := coalesce(current_setting('app.settings.api_url', true), 'http://api:3000') || p_path,
    body    := p_body,
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-internal-secret', current_setting('app.settings.internal_secret', true)
    ),
    timeout_milliseconds := 10000
  );
end;
$$;

create or replace function public.parse_app_version(v text)
returns int[]
language plpgsql
immutable
as $$
declare
  parts text[];
  result int[] := array[0, 0, 0];
  i int;
begin
  if v is null then
    return null;
  end if;

  parts := string_to_array(split_part(v, '+', 1), '.');
  for i in 1..least(coalesce(array_length(parts, 1), 0), 3) loop
    result[i] := coalesce(nullif(regexp_replace(parts[i], '\D.*$', ''), '')::int, 0);
  end loop;

  return result;
exception
  when others then
    return array[0, 0, 0];
end;
$$;

create or replace function public.haversine_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
) returns double precision
language sql
immutable
as $$
  select 2 * 6371 * asin(
    sqrt(
      sin(radians(lat2 - lat1) / 2) ^ 2 +
      cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
    )
  );
$$;
