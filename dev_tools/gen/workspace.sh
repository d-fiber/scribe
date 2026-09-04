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

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)
cd "$ROOT"

LAYER_DIRS=(engine/contracts engine/runtime engine/kernel engine/embedder engine/testing engine/shell tests)
SEALED_LAYERS=(engine/contracts engine/runtime engine/kernel engine/embedder engine/testing engine/shell)

UNIVERSAL_SPECIFIERS='[
  "@scribe/alchemy",
  "@scribe/alchemy/body",
  "@scribe/alchemy/http",
  "@scribe/alchemy/observe",
  "@scribe/alchemy/route",
  "@scribe/alchemy/server",
  "@scribe/alchemy/test"
]'

RESOLVE_PATH='
def resolve_path(layer; target):
  if (target | startswith("./") or startswith("../")) then
    (layer | split("/")) as $base |
    (target | split("/")) as $parts |
    (reduce $parts[] as $step ($base;
      if $step == "" or $step == "." then .
      elif $step == ".." then .[0:-1]
      else . + [$step]
      end
    )) as $segments |
    ($segments | join("/")) as $joined |
    if (target | endswith("/")) and (($joined | endswith("/")) | not) then
      "./" + $joined + "/"
    else
      "./" + $joined
    end
  else
    target
  end;
'

# deno's own glob matching for `exclude` breaks on a pattern that mixes a "*" wildcard with a
# config file that is not itself the directory being scanned — which dev_tools/runtime/deno/ never
# is, now that deno.json lives under it rather than at the root. A literal (wildcard-free) entry is
# unaffected, so a "*" entry is expanded here, against the real tree, into the literal paths it
# currently matches; scribe.workspace.json keeps writing the wildcard, since expansion runs fresh
# on every gen:workspace and a package added or removed is picked up the same way $layer_imports
# already is.
expand_globs() {
  local patterns out path
  patterns=$(cat)
  out="[]"
  shopt -s nullglob
  while IFS= read -r pattern; do
    if [[ "$pattern" == *'*'* ]]; then
      local matched=0
      for path in $pattern; do
        [ -e "$path" ] || continue
        matched=1
        out=$(jq --arg p "$path" '. + [$p]' <<<"$out")
      done
      [ "$matched" -eq 1 ] || out=$(jq --arg p "$pattern" '. + [$p]' <<<"$out")
    else
      out=$(jq --arg p "$pattern" '. + [$p]' <<<"$out")
    fi
  done < <(jq -r '.[]' <<<"$patterns")
  shopt -u nullglob
  printf '%s' "$out"
}

layers_json=$(
  for layer in "${LAYER_DIRS[@]}"; do
    jq --arg layer "$layer" '{layer: $layer, collection: .}' "$layer/_collection.json"
  done | jq -s '.'
)

layer_imports=$(jq -n --argjson layers "$layers_json" "$RESOLVE_PATH"'
  [$layers[] | .layer as $layer | .collection | to_entries[] |
    {specifier: .key, path: resolve_path($layer; .value)}] |
  group_by(.specifier) |
  map(
    if (map(.path) | unique | length) > 1 then
      error("\"" + .[0].specifier + "\" resolves two different ways across the layer files.")
    else
      {key: .[0].specifier, value: .[0].path}
    end
  ) |
  from_entries
')

# The logical config: same shape as scribe.workspace.json, root-relative throughout, imports
# merged with what the layers own. Neither deno nor bun reads this directly — each runtime gets
# its own translation below, written under dev_tools/runtime/ so the root carries only
# scribe.workspace.json, the file this repository actually authors by hand.
merged=$(jq --argjson layerImports "$layer_imports" '
  .imports as $current |
  ($layerImports | keys) as $owned |
  ($current | with_entries(select(.key as $k | ($owned | index($k)) | not))) as $kept |
  .imports = ($kept + $layerImports | to_entries | sort_by(.key) | from_entries)
' scribe.workspace.json)

mkdir -p dev_tools/runtime/deno dev_tools/runtime/bun

# dev_tools/runtime/imports.json: the runtime-neutral import map, root-relative, that both
# translations below read from. `deno task check`, `deno lint` and friends never read this
# themselves; only the bun tsconfig generation does, and dev_tools/resolution/bun/generate.sh
# for its own narrower probe.
jq '{imports}' <<<"$merged" > dev_tools/runtime/imports.json

# dev_tools/runtime/targets.json: what `check`, `test` and friends mean, named without a runtime
# in sight — which directories, whether a target only wants documented examples, what a "test"
# target loads as its env file and how much network it needs. `tools` sits next to it for the
# handful of commands that were never a "pick a runtime" question to begin with (lint is a
# static-analysis pass over source text, gen:workspace is this very script), so they stay literal
# shell rather than pretending to a neutrality they don't have. Every dev_tools/runtime/<rt>/run.sh
# reads this and turns `targets.<name>` into whatever that runtime's own tools call it — adding a
# third runtime means adding a third run.sh next to it, not touching this file, scribe.workspace.json
# or the two run.sh scripts already there.
jq '{targets, tools}' <<<"$merged" > dev_tools/runtime/targets.json

# The deno.json translation. `imports`, `exclude`, `fmt.exclude` and `lint.exclude` are all
# resolved relative to wherever deno.json itself lives, so every root-relative path gets a
# "../../../" climb back to the root three levels up (dev_tools/runtime/deno -> dev_tools/runtime
# -> dev_tools -> root). `deno task <name>` runs with that same directory as its cwd regardless of
# where it was invoked from: a `targets` task delegates straight to "./run.sh <name>", which sits
# in that same directory and does its own "cd back to $ROOT" before touching a root-relative path; a
# `tools` task has no run.sh to delegate to, so it gets a literal "cd ../../.. &&" instead, the same
# climb every other relative value in this file needs.
expanded_exclude=$(jq '.exclude' <<<"$merged" | expand_globs)
expanded_fmt_exclude=$(jq '.fmt.exclude' <<<"$merged" | expand_globs)
expanded_lint_exclude=$(jq '.lint.exclude' <<<"$merged" | expand_globs)

target_tasks=$(jq '
  .targets | keys | map({key: ., value: ("./run.sh " + .)}) | from_entries
' <<<"$merged")
tool_tasks=$(jq '.tools | with_entries(.value |= ("cd ../../.. && " + .))' <<<"$merged")

deno_json=$(jq \
  --argjson exclude "$expanded_exclude" \
  --argjson fmtExclude "$expanded_fmt_exclude" \
  --argjson lintExclude "$expanded_lint_exclude" \
  --argjson targetTasks "$target_tasks" \
  --argjson toolTasks "$tool_tasks" '
  .imports |= (with_entries(.value |= (if startswith("./") then "../../../" + .[2:] else . end))) |
  .exclude = ($exclude | map("../../../" + .)) |
  .fmt.exclude = ($fmtExclude | map("../../../" + .)) |
  .lint.exclude = ($lintExclude | map("../../../" + .)) |
  del(.targets, .tools) |
  .tasks = ($targetTasks + $toolTasks | to_entries | sort_by(.key) | from_entries)
' <<<"$merged")
printf '%s\n' "$deno_json" > dev_tools/runtime/deno/deno.json

# The bun translation: bun and tsc both understand a tsconfig's `paths`, not deno.json's
# `imports`, so the same import map becomes a path map instead. npm:/jsr: specifiers are left out
# since bun resolves those from its own package registry, the way deno resolves them from its
# own. `baseUrl` climbs the same three levels dev_tools/runtime/bun/ sits under root, so a
# root-relative value out of the import map needs no further rewriting, unlike deno.json's.
bun_paths=$(jq '
  .imports
  | to_entries
  | map(select(.value | (startswith("npm:") or startswith("jsr:")) | not))
  | map(
      if (.key | endswith("/")) then
        {key: (.key + "*"), value: [.value + "*"]}
      else
        {key, value: [.value]}
      end
    )
  | from_entries
' <<<"$merged")
jq -n --argjson paths "$bun_paths" '{compilerOptions: {baseUrl: "../../..", paths: $paths}}' \
  > dev_tools/runtime/bun/generated.tsconfig.json

sealed_json='{"alchemy/": []}'
for layer in "${SEALED_LAYERS[@]}"; do
  declared=$(jq --arg layer "$layer" '.[] | select(.layer == $layer) | .collection | keys' <<<"$layers_json")
  merged=$(jq -n --argjson declared "$declared" --argjson universal "$UNIVERSAL_SPECIFIERS" \
    '($declared + $universal) | unique | sort')
  sealed_json=$(jq --arg layer "$layer/" --argjson specifiers "$merged" '. + {($layer): $specifiers}' <<<"$sealed_json")
done

TS_LICENSE_HEADER='// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.'

{
  printf '%s\n\n' "$TS_LICENSE_HEADER"
  echo "/**"
  echo " * Every \`@scribe/*\` specifier a sealed engine layer may resolve, written by"
  echo " * \`deno task gen:workspace\` from the \`_collection.json\` each layer carries."
  echo " *"
  echo " * @remarks"
  echo " * \`.lint/engine-layers.ts\` imports this rather than reading a file itself, since a rule never"
  echo " * touches the filesystem itself, \`ast.ts\` says so. Hand-editing this file is pointless, since"
  echo " * the next \`gen:workspace\` overwrites it from the seven \`_collection.json\` files that are the"
  echo " * actual source."
  echo " */"
  printf 'export const LAYER_SPECIFIERS: Record<string, readonly string[]> = %s;\n' \
    "$(jq '.' <<<"$sealed_json")"
} > .lint/engine_layers.generated.ts

deno fmt --config dev_tools/runtime/deno/deno.json \
  dev_tools/runtime/deno/deno.json \
  dev_tools/runtime/imports.json \
  dev_tools/runtime/bun/generated.tsconfig.json \
  .lint/engine_layers.generated.ts >/dev/null
