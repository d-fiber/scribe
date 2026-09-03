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
SCOPE="binaries"

MAXIMUM_BYTES=5242880
MAXIMUM_NAME="5 MB"
SAMPLE_BYTES=8192

ALLOWED="images/logo-transparent.png"

say() {
  echo "[$SCOPE] $1"
}

cd "$ROOT"

is_allowed() {
  for entry in $ALLOWED; do
    [ "$1" = "$entry" ] && return 0
  done
  return 1
}

binaries=""
oversized=""
checked=0
allowed=0

while IFS= read -r file; do
  [ -f "$file" ] || continue

  if is_allowed "$file"; then
    allowed=$((allowed + 1))
    continue
  fi

  checked=$((checked + 1))
  size=$(wc -c < "$file" | tr -d ' ')

  if [ "$size" -gt "$MAXIMUM_BYTES" ]; then
    oversized="$oversized$file	$size
"
  fi

  [ "$size" -eq 0 ] && continue

  sample=$(head -c "$SAMPLE_BYTES" "$file" | wc -c | tr -d ' ')
  readable=$(head -c "$SAMPLE_BYTES" "$file" | LC_ALL=C tr -d '\000' | wc -c | tr -d ' ')

  if [ "$sample" -ne "$readable" ]; then
    binaries="$binaries$file	$size
"
  fi
done < <(git ls-files)

if [ -n "$binaries" ]; then
  echo "" >&2
  printf '%s' "$binaries" | while IFS="	" read -r file size; do
    echo "BINARY   $file ($size bytes)" >&2
  done

  cat >&2 <<EOF

The files above hold bytes that are not text, and git tracks them.

A repository that carries a compiled artefact never gives it back. A push that
carries a file over 100 MB is refused by GitHub outright, and a file under that
limit stays in the history for ever, downloaded again by everyone who clones,
even after a later commit deletes it. The compiled tools of this framework weigh
114 MB on Linux, which is why they are attached to a release instead.

If one of these is an artefact, delete it and add its path to .gitignore. If it
is a source file that happens to hold a byte sequence this check reads as
binary, name it in ALLOWED at the top of this script.
EOF
  exit 1
fi

if [ -n "$oversized" ]; then
  echo "" >&2
  printf '%s' "$oversized" | while IFS="	" read -r file size; do
    echo "TOO BIG  $file ($size bytes)" >&2
  done

  cat >&2 <<EOF

The files above are text, but each one is over $MAXIMUM_NAME.

That is the ceiling this repository holds itself to, well under the 100 MB that
GitHub refuses. Nothing anyone writes by hand comes close: the largest file here
is a lock file of about 200 KB. A file this size is a dump, a bundle or a
generated blob, and git keeps every version of it for ever.

Move it out of the repository, or generate it at build time.
EOF
  exit 1
fi

echo ""
say "Read $checked tracked files, every one of them is text and under $MAXIMUM_NAME"
[ "$allowed" -gt 0 ] && say "Skipped $allowed files named in ALLOWED"
exit 0
