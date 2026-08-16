# Contributor License Agreement

> **Two blanks a lawyer has to fill before this is relied upon.**
>
> Clause 1 needs Fiber's full legal name and registered address. Clause 10 needs
> the governing law and the venue. Both are written below as `[...]`. Everything
> else is an adaptation of the Apache Individual Contributor License Agreement
> v2.0, which is the usual starting point and covers what scribe needs, but a
> contract is still a contract and this one has not been reviewed.

## Why scribe needs one at all

Most projects skip a CLA because their licence is symmetric. Under MIT or Apache
you can rely on the convention that a contribution arrives under the same terms
the project already grants, so nothing more needs to be said.

The PolyForm Shield License is not symmetric. It is written in one direction
only, from the licensor to everyone else. A contributor cannot meaningfully
grant it back: it would forbid Fiber from competing with itself, and it would not
give Fiber the right to redistribute the contribution to users under Fiber's own
terms.

So the usual shortcut does not apply here. Without a signed agreement, Fiber has
no right to merge an outside contribution at all.

## The agreement

By signing, You accept and agree to the following terms for Your present and
future Contributions to scribe. Except for the licences granted here to Fiber,
You keep all right, title and interest in Your Contributions.

### 1. Definitions

**"Fiber"** means [Fiber's full legal name], a company registered at
[registered address].

**"You"** means the copyright owner, or the legal entity authorised by the
copyright owner, entering into this agreement with Fiber. For a legal entity,
the entity making a Contribution and all other entities that control, are
controlled by, or are under common control with that entity are treated as a
single Contributor. "Control" means ownership of more than fifty percent of the
outstanding shares, the power to direct the management of the entity, or
beneficial ownership of the entity.

**"Contribution"** means any work of authorship, including any modification or
addition to an existing work, that is intentionally Submitted by You to Fiber
for inclusion in, or documentation of, scribe.

**"Submitted"** means any form of electronic, verbal or written communication
sent to Fiber or its representatives, including but not limited to pull
requests, issues, and messages on communication channels managed by Fiber, for
the purpose of discussing and improving scribe. It excludes communication that
You conspicuously mark, in writing, as "Not a Contribution".

### 2. Grant of copyright licence

You grant to Fiber, and to recipients of software distributed by Fiber, a
perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable
copyright licence to reproduce, prepare derivative works of, publicly display,
publicly perform, sublicense and distribute Your Contributions and such
derivative works.

This licence is deliberately broad enough that Fiber may distribute Your
Contribution under the PolyForm Shield License, under a different licence, or
under more than one licence at the same time, including a commercial licence.
You keep the copyright on Your own work; this is a licence, not an assignment,
and nothing here stops You from using Your Contribution for any other purpose.

### 3. Grant of patent licence

You grant to Fiber, and to recipients of software distributed by Fiber, a
perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable patent
licence to make, have made, use, offer to sell, sell, import and otherwise
transfer scribe. This applies only to those patent claims licensable by You that
are necessarily infringed by Your Contribution alone, or by the combination of
Your Contribution with scribe.

If any entity brings patent litigation against You or any other entity, alleging
that Your Contribution or scribe constitutes direct or contributory patent
infringement, then any patent licence granted here for that Contribution or for
scribe terminates as of the date such litigation is filed.

### 4. Your right to grant these licences

You represent that You are legally entitled to grant the licences above.

If Your employer has rights to intellectual property that You create, You
represent that You have received permission to make the Contribution on behalf
of that employer, that Your employer has waived such rights, or that Your
employer has separately signed this agreement with Fiber. Employers usually own
what their staff write in the course of employment, so this is the clause that
most often needs attention before a first contribution.

### 5. Originality

You represent that each of Your Contributions is Your original creation.

You represent that Your Contribution submissions include complete details of any
third-party licence or other restriction of which You are personally aware and
which is associated with any part of Your Contributions.

### 6. Third-party work

If You wish to submit work that is not Your original creation, You may submit it
separately from any Contribution, identifying the complete details of its source
and of any licence or other restriction of which You are personally aware, and
conspicuously marking the work as "Submitted on behalf of a third party:
[named here]".

### 7. No obligation to use

You understand that the decision to include Your Contribution in scribe is
entirely at the discretion of Fiber, and that this agreement does not oblige
Fiber to use, merge or distribute Your Contribution.

### 8. No support, and disclaimer

You are not expected to provide support for Your Contributions, except to the
extent You wish to. You may provide support for free, for a fee, or not at all.

Unless required by applicable law or agreed to in writing, and except for the
representations You make in clauses 4, 5 and 6, You provide Your Contributions
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied, including, without limitation, any warranties or conditions
of TITLE, NON-INFRINGEMENT, MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### 9. Changed circumstances

You agree to notify Fiber of any facts or circumstances of which You become
aware that would make these representations inaccurate in any respect.

### 10. Governing law

This agreement is governed by the law of [governing law], and any dispute
arising out of it falls under the exclusive jurisdiction of the courts of
[venue].

## How signing works

One signature per person, not per pull request.

Signing means adding yourself to `signatures.json` in this directory, through a
pull request of its own:

```json
{
  "email": "you@example.com",
  "name": "Your Name",
  "github": "your-github-handle",
  "date": "2026-08-16"
}
```

The email must be the one your commits are authored with, since that is what the
check compares. If you commit under several addresses, list an entry for each.

The `signed` verdict in CI reads that file. `main` will not take a commit whose
author is neither listed nor exempt.

Fiber staff are exempt: their employment contract already covers what they write
at work, so a second agreement would be redundant. Bots are exempt because they
author no original work. Both exemptions are declared in `signatures.json` and
are matched on the commit author's address.

If you cannot sign, open an issue describing the change instead. A clear
description of the problem is often more useful than the patch.
