#!/usr/bin/env bash
# Copyright (C) 2026 Fiber
#
# This file is part of scribe and is made available under the PolyForm Shield
# License 1.0.0. The full terms are in the LICENSE file at the root of this
# repository, and at https://polyformproject.org/licenses/shield/1.0.0
#
# What you may do:
# - Use this software for any purpose, including commercially, and build and
#   sell your own products on top of it.
# - Change it, and create new works based on it.
# - Distribute copies of it, with or without your changes.
#
# The one thing you may not do:
# - Use it to provide any product that competes with scribe, or with any
#   product Fiber or its affiliates provide using scribe. Products compete
#   even when they are offered free of charge, through a different kind of
#   interface, or for a different technical platform.
#
# If you pass this software on:
# - Anyone who receives any part of it from you must also receive these terms,
#   or the URL above, together with the "Required Notice" line carried by the
#   LICENSE file.
#
# Disclaimer:
# AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
# CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
# OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
# LEGAL CLAIM.
#
# This header is a summary written for convenience. Where it differs from the
# LICENSE file, the LICENSE file governs.

set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
SCOPE="gen:proto"
PRESERVED="sdk/js/gen/schema/enums.ts"

say() {
  echo "[$SCOPE] $1"
}

fail() {
  echo "[$SCOPE] $1" >&2
  exit 1
}

locate_plugin() {
  local name=$1
  local candidate
  for candidate in \
    "$ROOT/sdk/js/node_modules/.bin/$name" \
    "${HOME:-}/.pub-cache/bin/$name" \
    "/opt/homebrew/bin/$name" \
    "/usr/local/bin/$name"; do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  command -v "$name" 2>/dev/null || true
}

generate() {
  local language=$1 plugin_name=$2 hint=$3 output=$4
  shift 4

  local plugin
  plugin=$(locate_plugin "$plugin_name")
  if [ -z "$plugin" ]; then
    say "$language: $plugin_name is not installed, target skipped."
    say "$language: install it with \`$hint\`."
    return 0
  fi

  rm -rf "$ROOT/$output"
  mkdir -p "$ROOT/$output"

  protoc -I "$STAGE" "--plugin=$plugin_name=$plugin" "$@" "${SOURCES[@]}"

  local emitted
  emitted=$(find "$ROOT/$output" -type f | wc -l | tr -d ' ')
  say "$language: $emitted files written to $output."
}

command -v protoc >/dev/null 2>&1 || fail "protoc is not installed, run \`brew install protobuf\`."
say "using $(protoc --version)."

SOURCES=()
while IFS= read -r file; do
  SOURCES+=("scribe/${file#./}")
done < <(
  find "$ROOT" -type d \( -name .git -o -name node_modules \) -prune -o \
    -type f -name '*.proto' -print \
    | sed "s|^$ROOT/|./|" \
    | grep -E '(^|/)protocol/' \
    | sort
)

[ ${#SOURCES[@]} -gt 0 ] || fail "no .proto found under **/protocol/."

if [ "$(basename "$ROOT")" = "scribe" ]; then
  STAGE=$(dirname "$ROOT")
else
  STAGE=$(mktemp -d)
  trap 'rm -rf "$STAGE"' EXIT
  ln -s "$ROOT" "$STAGE/scribe"
fi

protoc -I "$STAGE" --descriptor_set_out=/dev/null "${SOURCES[@]}" \
  || fail "protoc rejected the contract."
say "${#SOURCES[@]} .proto validated."

KEPT=""
if [ -f "$ROOT/$PRESERVED" ]; then
  KEPT=$(mktemp)
  cp "$ROOT/$PRESERVED" "$KEPT"
fi

generate js protoc-gen-es \
  "npm install --prefix sdk/js @bufbuild/protobuf @bufbuild/protoc-gen-es" \
  sdk/js/gen \
  "--es_out=$ROOT/sdk/js/gen" \
  "--es_opt=target=ts,import_extension=.ts,json_types=true"

if [ -n "$KEPT" ]; then
  mkdir -p "$(dirname "$ROOT/$PRESERVED")"
  cp "$KEPT" "$ROOT/$PRESERVED"
  rm -f "$KEPT"
  say "restored $PRESERVED, which the js target wipes with its output directory."
fi

generate dart protoc-gen-dart \
  "dart pub global activate protoc_plugin" \
  sdk/dart/lib/gen \
  "--dart_out=$ROOT/sdk/dart/lib/gen"
