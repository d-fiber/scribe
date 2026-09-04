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
# Turns a runtime-neutral target from dev_tools/runtime/targets.json into an actual `deno` command.
# This is the only file in the repository that knows what flag deno wants for "give this test
# network access" or "only check documented examples" — scribe.workspace.json names the target,
# dev_tools/gen/workspace.sh never translates it, and dev_tools/verify/*.sh and CI call this script
# instead of spelling deno flags out themselves. A future runtime gets its own
# dev_tools/runtime/<name>/run.sh next to this one; nothing here changes for it to exist.
#
# usage: run.sh <target-name>

set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
CONFIG="$HERE/deno.json"
LOCK="$HERE/deno.lock"
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

# "lint:builtin" carries no dirs, script, docsOnly or network — a whole-tree scan against deno's
# own exclude rules is not a shape any other target has, so it is named directly rather than
# forced into that vocabulary. A runtime with no built-in linter of its own just refuses this
# target, the way dev_tools/runtime/bun/run.sh does.
if [ "$name" = "lint:builtin" ]; then
  cd "$ROOT"
  exec deno lint --config "$CONFIG" .
fi

script=$(jq -r '.script // empty' <<<"$target")
env_file=$(jq -r '.envFile // empty' <<<"$target")
network=$(jq -r '.network // empty' <<<"$target")
docs_only=$(jq -r '.docsOnly // false' <<<"$target")

cd "$ROOT"

if [ -n "$script" ]; then
  exec deno run --allow-read --allow-env --config "$CONFIG" --lock "$LOCK" "$script"
fi

dirs=()
while IFS= read -r dir; do dirs+=("$dir"); done < <(jq -r '.dirs[]' <<<"$target")

if [ "$docs_only" = "true" ]; then
  exec deno test --doc --no-run --config "$CONFIG" --lock "$LOCK" "${dirs[@]}"
fi

if [ -n "$network" ]; then
  net_flag="--allow-net=127.0.0.1"
  [ "$network" = "full" ] && net_flag="--allow-net"

  env_flag=()
  [ -n "$env_file" ] && env_flag=(--env-file="$env_file")

  exec deno test --config "$CONFIG" --lock "$LOCK" \
    --allow-env --allow-sys --allow-read --allow-write --allow-run \
    "$net_flag" "${env_flag[@]}" --parallel "${dirs[@]}"
fi

exec deno check --config "$CONFIG" --lock "$LOCK" "${dirs[@]}"
