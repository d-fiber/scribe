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

create table if not exists public.internal_t__mails (
  mail_id            bigint                 primary key generated always as identity,
  email_template_id  bigint                 references public.internal_t__email_templates(email_template_id) on delete restrict,
  recipient          text                   not null,
  subject            text,
  data               jsonb,
  status             text                   not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  account            text                   not null references public.internal_t__smtp_accounts(name) on update cascade on delete restrict,
  tracking_token     text                   not null unique,
  created_at         bigint                 not null,
  updated_at         bigint                 not null
);

create index if not exists mails_recipient_idx
  on public.internal_t__mails (recipient, created_at);

create index if not exists mails_email_template_id_idx
  on public.internal_t__mails (email_template_id)
  where email_template_id is not null;

alter table public.internal_t__mails enable row level security;

revoke all on public.internal_t__mails from authenticated, anon;

create trigger mails_set_timestamps
  before insert or update on public.internal_t__mails
  for each row execute function public.set_timestamps();

create or replace function notify_mail_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'pending' then
    return new;
  end if;

  perform public.call_internal_api(
    '/messaging/email/sender',
    jsonb_build_object('mail_id', new.mail_id)
  );

  return new;
exception
  when others then
    raise warning '[notify_mail_inserted] error: %', sqlerrm;
    return new;
end;
$$;

create trigger on_mail_inserted
  after insert on public.internal_t__mails
  for each row execute function notify_mail_inserted();

create or replace function public.generate_tracking_token()
returns text
language sql
volatile
as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

create or replace function public.queue_email(
  p_template_name text,
  p_recipient      text,
  p_data           jsonb,
  p_account        text default 'account'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email_template_id bigint;
  v_mail_id            bigint;
begin
  select email_template_id into v_email_template_id
  from public.internal_t__email_templates
  where name = p_template_name;

  if v_email_template_id is null then
    raise warning '[queue_email] unknown template "%"', p_template_name;
    return null;
  end if;

  insert into public.internal_t__mails (
    email_template_id, recipient, data, status, account, tracking_token
  ) values (
    v_email_template_id,
    p_recipient,
    p_data,
    'pending',
    p_account,
    public.generate_tracking_token()
  )
  returning mail_id into v_mail_id;

  return v_mail_id;
exception
  when others then
    raise warning '[queue_email] error for template "%": %', p_template_name, sqlerrm;
    return null;
end;
$$;
