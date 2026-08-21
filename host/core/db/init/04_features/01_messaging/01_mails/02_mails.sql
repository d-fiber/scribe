-- Copyright (C) 2026 Fiber
--
-- This Source Code Form is subject to the terms of the Mozilla Public License,
-- v. 2.0. If a copy of the MPL was not distributed with this file, You can
-- obtain one at https://mozilla.org/MPL/2.0/.
--
-- What you may do:
-- - Use this software for any purpose, including commercially, and build and
--   sell your own products on top of it.
-- - Change it, and create new works based on it.
-- - Distribute copies of it, with or without your changes.
-- - Combine it with files under any other licence, proprietary ones included,
--   and licence that larger work on your own terms.
--
-- What you must do in return:
-- - Keep this notice on every file you received it on.
-- - Publish, under these same terms, the source of every file covered by them
--   that you distribute, including the ones you changed, so that whoever
--   receives your version can obtain that source.
-- - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
--   trademarks may not be used to endorse or promote what you build, and this
--   licence grants no right to them.
--
-- Disclaimer:
-- AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
-- OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
-- WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
-- NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
-- INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
-- LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
-- OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
-- KIND OF LEGAL CLAIM.
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
