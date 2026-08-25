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

set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SCOPE="packages"

EXCLUDED="node_modules .git .dart_tool __pycache__ gen"

# The number of cross-package imports that walk around a package's door today.
# It is a debt: it may go down, never up. Lower it when you fix one.
SIDE_DOOR_THRESHOLD=29

say() {
  echo "[$SCOPE] $1"
}

cd "$ROOT"

prune_arguments=()
for directory in $EXCLUDED; do
  prune_arguments+=(-name "$directory" -o)
done

sources=$(mktemp)
side_doors=$(mktemp)
test_imports=$(mktemp)
trap 'rm -f "$sources" "$side_doors" "$test_imports"' EXIT

find . \( "${prune_arguments[@]}" -false \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print \
  | sed 's|^\./||' \
  | sort > "$sources"

specifiers_of() {
  grep -oE '(from|import\(?)[[:space:]]*"[^"]+"' "$1" 2>/dev/null \
    | grep -oE '"[^"]+"' \
    | tr -d '"' \
    | sort -u
}

while IFS= read -r file; do
  case "$file" in
    packages/*) ;;
    *) continue ;;
  esac

  package=$(printf '%s' "$file" | cut -d/ -f2)

  for specifier in $(specifiers_of "$file"); do
    case "$specifier" in
      @scribe/*/lib/src/* | @scribe/*/lib/contracts/*) ;;
      *) continue ;;
    esac

    named=$(printf '%s' "$specifier" | cut -d/ -f2)
    [ "$named" = "$package" ] && continue

    echo "$file	$specifier" >> "$side_doors"
  done
done < "$sources"

while IFS= read -r file; do
  case "$file" in
    tests/* | */tests/*) continue ;;
  esac

  for specifier in $(specifiers_of "$file"); do
    case "$specifier" in
      */tests/*) ;;
      *) continue ;;
    esac

    echo "$file	$specifier" >> "$test_imports"
  done
done < "$sources"

touch "$side_doors" "$test_imports"
side_door_count=$(wc -l < "$side_doors" | tr -d ' ')
test_import_count=$(wc -l < "$test_imports" | tr -d ' ')

if [ "$test_import_count" -gt 0 ]; then
  echo "" >&2
  while IFS="	" read -r file specifier; do
    echo "TEST     $file" >&2
    echo "         reaches into a test directory through $specifier" >&2
  done < "$test_imports"

  cat >&2 <<EOF

The files above sit outside a tests directory and import a file inside one.
That is $test_import_count of them, and the rule allows none.

A tests directory holds fixtures, fakes and harnesses written to be thrown away
and rewritten, and nothing that ships is allowed to depend on them. Once
something under lib does, the fake becomes a published interface that cannot be
changed without breaking a caller, and a project that installs this framework
downloads the test tree along with the code it wanted.

Move what the two sides share into lib/src, and let the test import it from
there.
EOF
  exit 1
fi

if [ "$side_door_count" -gt "$SIDE_DOOR_THRESHOLD" ]; then
  echo "" >&2
  while IFS="	" read -r file specifier; do
    echo "SIDE     $file" >&2
    echo "         imports $specifier" >&2
  done < "$side_doors"

  cat >&2 <<EOF

The imports above walk around another package's door. That is $side_door_count of them,
against the $SIDE_DOOR_THRESHOLD this script allows.

A package publishes exactly one entry, lib/<name>.ts, and everything else it
holds sits under lib/src, which is its own business. An import that names
another package's lib/src or lib/contracts pins a path the owning package never
promised, so moving a file inside that package breaks a caller that had no way
of knowing it existed.

Import from @scribe/<package>/lib/<package>.ts. If what you need is not exported
there, that is the change to make: export it from the door.
EOF
  exit 1
fi

if [ "$side_door_count" -lt "$SIDE_DOOR_THRESHOLD" ]; then
  cat >&2 <<EOF

The debt is down to $side_door_count, and the script still allows $SIDE_DOOR_THRESHOLD.

The number is a debt that may only go down, so it has to follow. Set
SIDE_DOOR_THRESHOLD to $side_door_count at the top of this script and commit that with your fix,
otherwise the ones you just paid off come back without anyone noticing.
EOF
  exit 1
fi

echo ""
say "No file outside a tests directory imports one inside it"
say "The debt of imports that walk around another package's door stands at $side_door_count, which is what is allowed"
