# Contributor License Agreement

> **This document is not in force yet. It has no legal text.**
>
> The machinery around it works: the CI check, the signature file, and the rule
> that no unsigned contribution reaches `main`. What is missing is the agreement
> itself, which is a contract and has to be drafted or adapted by a lawyer. Until
> the text below is replaced, treat every external contribution as unmergeable.

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

## What the text must cover

Four things, and the first two are the reason the document exists.

**A copyright licence to Fiber**, broad enough that Fiber can use, modify,
sublicense and redistribute the contribution as part of scribe, including under
a different licence later. The contributor keeps the copyright on their own work;
this is a licence, not an assignment.

**A patent licence**, so a contributor cannot later assert a patent covering the
code they themselves contributed.

**A warranty of originality**: the contribution is the contributor's own work,
and they have the right to submit it. Anyone contributing in the course of
employment needs their employer's agreement, since employers usually own what
their staff write.

**A disclaimer**, since the contribution is provided as is.

The Apache Individual Contributor License Agreement is the usual starting point
and covers all four. Adapting it is a smaller job than drafting from scratch, but
it is still a job for someone whose profession it is.

## How signing works, once the text exists

One signature per person, not per pull request. A signature is a line added to
`signatures.json` in this directory, through a pull request that Fiber merges.
The CI check reads that file and refuses any commit whose author is neither
listed nor exempt.

Fiber staff are exempt: their employment contract already covers what they write
at work, so a second agreement would be redundant. Bots are exempt because they
author no original work.
