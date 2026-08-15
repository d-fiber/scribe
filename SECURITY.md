# Security

## Reporting a vulnerability

**Do not open an issue.** Issues are public, and a public issue on a backend
framework is a disclosure to everyone running it before anyone can patch.

Use GitHub's private vulnerability reporting instead: the **Security** tab of
this repository, then **Report a vulnerability**. It creates a private thread
between you and the maintainers, and it is the only channel that is watched.

If that form is unavailable to you, write to `security@fiberstudio.app` and say that
you could not use the form.

Include enough for someone to reproduce: the version from `VERSION`, the
component (`host/`, `sdk/js/`, the protocol, a dependency module), what you did,
and what happened. A proof of concept helps more than a description of a class
of bug.

## What happens next

We aim to acknowledge a report within three working days and to tell you within
ten whether we consider it a vulnerability, with our reasoning either way. If a
fix is warranted, we will tell you when it ships, and we will credit you in the
changelog unless you ask us not to.

Please give us reasonable time to fix an issue before making it public. We will
not take legal action against someone who reports in good faith, stays within
the scope below, and does not access or modify data that is not theirs.

## Supported versions

scribe has not had a stable release yet. Only the current state of `main` is
supported. `main` is what people clone, `dev` is where work happens, and a
report against `dev` is welcome but may already be fixed.

Once releases exist, this section will name which ones still receive fixes.

## Scope

In scope, because they are the framework's responsibility:

- authentication and session handling, including OTP, tokens and social sign-in
- the owner filter and anything that could let one user reach another's rows
- the firewalls applied before a request reaches application code: app key,
  country restriction, rate limiting
- webhook signature verification
- the device payload and its encryption
- the capability token that lets a worker call back into the host
- the admin surface and its VPN gate
- privilege escalation through the RBAC permissions

Out of scope, because they belong to whoever deploys scribe:

- secrets committed to a project's own repository, or a `config.yaml` left
  readable
- a deployment that exposes the admin API without the VPN, or Postgres directly
- vulnerabilities in a project's own code under `lib/`
- missing rate limits on a route a project wrote and did not configure
- findings from an automated scanner with no demonstrated impact

## Decisions that look like findings, and are not

Three come up often enough to be worth stating, so that a report about them can
be answered with a link rather than a discussion.

**The owner filter lives in the query builder, not in row level security.** It is
injected by the constructor of every query rather than enforced by Postgres. This
is deliberate: it makes the filter impossible to forget at the call site, and it
is what lets the worker protocol carry no owner field at all. A `Query` that
crosses owners is not blocked, it is inexpressible. If you can build one, that is
a finding and we want to hear about it.

**The admin API is behind a VPN rather than public authentication.** It is not an
oversight or a substitute for authentication, which it also has. It is a second
gate, and the compose and gateway configuration both assume it.

**A worker cannot forge an identity.** It never receives one it could replay
elsewhere: the host issues an opaque capability token scoped to a single
invocation, revoked when the response is rendered. A worker that could act as
another user, or reuse a token after its invocation, is a finding.

## What we do not consider a vulnerability

The licence forbids competing use. Using scribe in a way the licence forbids is a
licensing matter, not a security one, and reports of that nature belong in an
email rather than the security tab.
