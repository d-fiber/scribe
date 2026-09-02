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

deno_json=$(jq --argjson layerImports "$layer_imports" '
  .imports as $current |
  ($layerImports | keys) as $owned |
  ($current | with_entries(select(.key as $k | ($owned | index($k)) | not))) as $kept |
  .imports = ($kept + $layerImports | to_entries | sort_by(.key) | from_entries)
' scribe.workspace.json)
printf '%s\n' "$deno_json" > deno.json

jq '{imports}' <<<"$deno_json" > scribe.imports.json

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

deno fmt deno.json scribe.imports.json .lint/engine_layers.generated.ts >/dev/null
