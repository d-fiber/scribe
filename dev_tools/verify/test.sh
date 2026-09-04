#!/usr/bin/env bash
# Copyright (C) 2026 Fiber
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can
# obtain one at https://mozilla.org/MPL/2.0/.
#
# What you may do:
# - Use this software for any purpose, including commercially, and build and
#   sell your own products on top of it.
# - Change it, and create new works based on it.
# - Distribute copies of it, with or without your changes.
# - Combine it with files under any other licence, proprietary ones included,
#   and licence that larger work on your own terms.
#
# What you must do in return:
# - Keep this notice on every file you received it on.
# - Publish, under these same terms, the source of every file covered by them
#   that you distribute, including the ones you changed, so that whoever
#   receives your version can obtain that source.
# - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
#   trademarks may not be used to endorse or promote what you build, and this
#   licence grants no right to them.
#
# Disclaimer:
# AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
# OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
# WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
# NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
# LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
# OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
# KIND OF LEGAL CLAIM.
#
# This header is a summary written for convenience. Where it differs from the
# LICENSE file, the LICENSE file governs.

set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SCOPE="test"

say() {
  echo "[$SCOPE] $1"
}

[ -f "$ROOT/packages/foundation/package.yaml" ] || {
  echo "[$SCOPE] packages/ is empty, so this checkout is not a whole one." >&2
  exit 1
}

say "writing dev_tools/runtime/{deno,bun} from scribe.workspace.json"
(cd "$ROOT" && bash dev_tools/gen/workspace.sh)

# `test` and `test:net` are targets, declared once in scribe.workspace.json without naming a
# runtime, and dev_tools/runtime/deno/run.sh is what turns "test:net" into the actual deno flags
# (--config/--lock, staying at $ROOT, rather than through `deno task`, whose commands run with the
# config's own directory as their cwd).
say "running the workspace, offline"
(cd "$ROOT" && bash dev_tools/runtime/deno/run.sh test)

say "running the workspace, with network access"
(cd "$ROOT" && bash dev_tools/runtime/deno/run.sh test:net)

say "running sdk/js"
(cd "$ROOT/sdk/js" && deno task test)

# This is not the whole workspace under bun yet: some packages only carry a jsr:-only, Deno-only
# dependency (@nats-io/transport-deno has no bun-reachable equivalent bound in the import map),
# which bun cannot resolve at all. What this does prove, on every run, is that specifier
# resolution and the engine/runtime/scholium/bun/* adapters actually work under a real `bun test`,
# not just under deno - the gap most likely to go unnoticed if only deno ever ran these.
say "running the resolution probe under both runtimes"
(cd "$ROOT" && bash dev_tools/resolution/run.sh all)

echo ""
say "every suite the CI runs on a push is green."
say "the end-to-end suites need a stack up and are not part of this, see scribe.workspace.json."
