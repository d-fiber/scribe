# Contributing to scribe

## The license, in one paragraph

scribe is published under the [Mozilla Public License 2.0](LICENSE). You may read it, run it, change it, distribute it,
and combine it with files under any other licence, a proprietary one included, and licence that larger work on your own
terms.

What you owe in return is per file: the source of every file covered by these terms that you distribute, including the
ones you changed, stays available under the same terms. Every file carries the notice that says so, and it survives
being copied into somebody else's tree.

## Contributor License Agreement

Every pull request needs a signed CLA before it can be merged. This is a one time thing per contributor, not per pull
request.

The reason is narrow and worth stating plainly: the license lets you change your own copy, but it does not give Fiber
any right to your changes. Without a CLA, a patch cannot legally be merged into the official repository, however good it
is. The CLA grants Fiber the right to use, modify, relicense and distribute what you contribute, while you keep the
copyright on your own work.

If you cannot sign it, open an issue describing the change instead. A clear description of the problem is often more
useful than the patch anyway.

The agreement and the way to sign it are in [.github/cla/CLA.md](.github/cla/CLA.md). CI checks every commit author in a
pull request against `.github/cla/signatures.json`, and `main` will not take a commit from someone who is neither listed
nor exempt. Fiber staff and bots are exempt: an employment contract already covers the first, and the second write
nothing of their own.

## Before you open a pull request

Push to `dev`. There is no third branch: a ruleset refuses the creation of any branch other than `dev` and `main`, so
the history stays one line. Nobody pushes to `main` at all, including maintainers.

`main` moves once, deliberately, when someone runs the **release** workflow by hand. Up to that moment `dev` accumulates
commits and nothing else happens: versions do not move, `CHANGELOG.md` does not change. The release run is what gathers
everything since the last one, works out the bump, writes the changelog in a single entry, commits it to `dev` and opens
the pull request into `main`.

    push, push, push ...  on dev, nothing else moves
    release workflow      one commit: versions + changelog
    pull request          dev into main, reviewed
    main                  what people clone

Run the release workflow with `dry-run` first if you want to see the version and the changelog it would produce without
writing anything.

Commit messages follow `[TAG]: message`, checked in CI:

    [DEV]: add the capability token to every invocation
    [BUGFIX]: keep the rate limit a node passes down
    [REFACTO]: move the rest engine out of dependencies
    [BREAKING]: replace the Mount enum with declared nodes

Run `bash .github/commits/check.sh` to see the full list of tags and the rules.

## Refuse your own bad push, before it leaves

Run this once after cloning:

    git config core.hooksPath .githooks

From then on `git push` runs the same lint, type check and header check that CI runs, and refuses the push if any of
them fails. It takes about two seconds because everything is cached.

It does not run the test suites. Those belong to CI, where they can take their time, and a hook people find slow is a
hook people turn off.

`git push --no-verify` skips it. Nothing bad happens: CI catches the same thing a minute later, and `main` refuses the
merge either way. The hook only saves you the round trip.

## What CI will check

    deno lint                     in engine/
    deno task check               in engine/
    deno task test                in engine/
    deno task test:net            in engine/
    deno task check && test       in sdk/js/
    python3 -m unittest ...       in .github/versioning/
    protoc                        on every .proto
    .github/headers/check.sh      on every source file

Every source file carries the license header, in the comment syntax of its language: `//` for TypeScript, Dart, Go, C
and friends, `#` for shell, Python and Ruby, `--` for SQL. It goes at the very top, or on the line after the shebang.
Copy it from any neighbouring file of the same language. CI refuses a file without it, and refuses one that carries a
copyright line without naming the license.

Versions are not bumped by hand. `.github/versioning/bump.py` compares the public surface of each component between two
revisions and decides on its own whether the change is a major, a minor or a patch. Removing an exported symbol or a
protobuf field is a major, adding one is a minor.

Three components carry their own version: `protocol/VERSION`, `engine/core` and `sdk/js`. The `VERSION` file at the root
is the version of scribe as a whole, and it moves by the strongest bump any component took. It is the number a project
compares itself against when it checks for an update, so it is the one that matters to people who install scribe rather
than work on it.

`CHANGELOG.md` is written by the same run, from commit subjects grouped by tag. This is what your `[TAG]:` prefix ends
up doing, which is a good reason to pick it carefully. `[RELEASE]` commits are left out, since they are the bookkeeping
itself.

One tag carries more weight than the others. A surface diff sees a symbol disappear, but it cannot see a field that kept
its name and changed its meaning, which is the worst kind of break because nothing fails at compile time. Tagging such a
commit `[BREAKING]` forces the release to a major even when the diff found nothing worse than an addition. It is the
only way a human can tell the tooling something it has no way of working out.

## Two rules that surprise people

**No comments in code.** Not `//`, not JSDoc. If a passage needs explaining, the naming or the split is wrong. The
reasoning goes in the documentation, which outlives the refactor that would have made the comment a lie. The only
exception is the copyright header.

**Logs are in English**, in the form `[scope] message`, lowercase. They leave the repository and get read by tools.
