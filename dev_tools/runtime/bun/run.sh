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
#
# Turns a runtime-neutral target from dev_tools/runtime/targets.json into an actual `bun` command —
# the bun counterpart of dev_tools/runtime/deno/run.sh, see that file for why this exists.
#
# usage: run.sh <target-name>

set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
TSCONFIG="$HERE/generated.tsconfig.json"
TARGETS="$ROOT/dev_tools/runtime/targets.json"

name="${1:-}"
[ -n "$name" ] || {
  echo "usage: $0 <target-name>" >&2
  exit 1
}

[ -f "$TARGETS" ] || {
  echo "$0: $TARGETS is missing. Run \`bash dev_tools/gen/workspace.sh\` first." >&2
  exit 1
}

target=$(jq --arg name "$name" '.targets[$name] // empty' "$TARGETS")
[ -n "$target" ] || {
  echo "$0: scribe.workspace.json declares no target \"$name\"." >&2
  exit 1
}

if [ "$name" = "lint:builtin" ]; then
  echo "$0: bun has no linter of its own that this repository uses — see lint:custom." >&2
  exit 1
fi

docs_only=$(jq -r '.docsOnly // false' <<<"$target")
if [ "$docs_only" = "true" ]; then
  echo "$0: \"$name\" only exists as a deno concept — \`--doc\` doctests have no bun equivalent." >&2
  exit 1
fi

script=$(jq -r '.script // empty' <<<"$target")
env_file=$(jq -r '.envFile // empty' <<<"$target")
network=$(jq -r '.network // empty' <<<"$target")

cd "$ROOT"

if [ -n "$script" ]; then
  exec bun run --tsconfig-override="$TSCONFIG" "$script"
fi

dirs=()
while IFS= read -r dir; do dirs+=("$dir"); done < <(jq -r '.dirs[]' <<<"$target")

if [ -n "$network" ]; then
  # bun runs unsandboxed: there is no permission flag standing in for "loopback only" vs "full
  # network", the way deno's --allow-net does, so both `test` and `test:net` run identically here.
  env_flag=()
  [ -n "$env_file" ] && env_flag=(--env-file="$env_file")

  exec bun test --tsconfig-override="$TSCONFIG" "${env_flag[@]}" "${dirs[@]}"
fi

echo "$0: \"$name\" is not wired up for bun yet — bun has no equivalent of deno's own type checker," \
  "and a project-wide tsc pass needs a fuller tsconfig (target/lib/strict) than" \
  "$TSCONFIG's path map alone." >&2
exit 1
