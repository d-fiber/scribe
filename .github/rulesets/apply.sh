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

REPOSITORY="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$REPOSITORY" ]; then
  echo "usage: $0 <owner>/<repo>" >&2
  exit 64
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "This needs the GitHub CLI. See https://cli.github.com" >&2
  exit 1
fi

apply_one() {
  ruleset="$1"
  name=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['name'])" "$ruleset")
  existing=$(gh api "repos/$REPOSITORY/rulesets" --jq ".[] | select(.name == \"$name\") | .id" 2>/dev/null || true)

  if [ -n "$existing" ]; then
    echo "Updating \"$name\" (id $existing) on $REPOSITORY"
    gh api --method PUT "repos/$REPOSITORY/rulesets/$existing" --input "$ruleset" --jq '"  " + .name + " is now " + .enforcement'
  else
    echo "Creating \"$name\" on $REPOSITORY"
    gh api --method POST "repos/$REPOSITORY/rulesets" --input "$ruleset" --jq '"  " + .name + " is now " + .enforcement'
  fi
}

for ruleset in "$HERE"/*.json; do
  apply_one "$ruleset"
done

cat <<EOF

Done. $REPOSITORY now rejects a direct push to main and an untagged commit
message. That applies to you too, so an urgent fix still goes through a pull
request.

To check what is in place:
  gh api repos/$REPOSITORY/rulesets --jq '.[] | .name + " (" + .enforcement + ")"'
EOF
