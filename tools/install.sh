#!/bin/sh
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

set -eu

REPOSITORY="${SCRIBE_REPOSITORY:-d-fiber/scribe}"
BRANCH="${SCRIBE_BRANCH:-main}"
TOOLS="scribe"
TOOLS_REPOSITORY="${SCRIBE_TOOLS_REPOSITORY:-d-fiber/scribe_tools}"
TEMPLATES_ASSET="scribe-templates.tar.gz"

say() { printf '%s\n' "$*"; }
fail() { printf '%s\n' "$*" >&2; exit 1; }

have() { command -v "$1" >/dev/null 2>&1; }

detect_platform() {
  system=$(uname -s)
  machine=$(uname -m)

  case "$system" in
    Linux)
      [ "$machine" = "x86_64" ] || fail "No build for Linux $machine, only x86_64 is published"
      PLATFORM="linux"
      EXTENSION=""
      ;;
    Darwin)
      [ "$machine" = "arm64" ] || fail "No build for macOS $machine, only Apple Silicon is published"
      PLATFORM="macos"
      EXTENSION=""
      ;;
    MINGW* | MSYS* | CYGWIN* | Windows_NT)
      PLATFORM="windows"
      EXTENSION=".exe"
      ;;
    *)
      fail "Unsupported system: $system"
      ;;
  esac
}

is_scribe_checkout() {
  [ -d "$1/.git" ] && [ -d "$1/tools" ] && [ -f "$1/deno.json" ] && [ -d "$1/engine" ]
}

locate_or_clone() {
  candidate=""

  if [ -n "${SCRIBE_DIRECTORY:-}" ]; then
    candidate="$SCRIBE_DIRECTORY"
  elif is_scribe_checkout "$(dirname "$0")/.."; then
    candidate="$(cd "$(dirname "$0")/.." && pwd)"
  elif is_scribe_checkout "$(pwd)"; then
    candidate="$(pwd)"
  fi

  if [ -n "$candidate" ] && is_scribe_checkout "$candidate"; then
    ROOT="$(cd "$candidate" && pwd)"
    say "Installing into the checkout at $ROOT"
    return
  fi

  ROOT="${SCRIBE_DIRECTORY:-$(pwd)/scribe}"

  if [ -d "$ROOT/.git" ]; then
    say "Reusing the clone at $ROOT"
    return
  fi

  [ -e "$ROOT" ] && fail "$ROOT already exists and is not a scribe clone"

  say "Cloning $REPOSITORY into $ROOT"
  if have gh; then
    gh repo clone "$REPOSITORY" "$ROOT" -- --branch "$BRANCH" --depth 1
  elif have git; then
    git clone --branch "$BRANCH" --depth 1 "https://github.com/$REPOSITORY.git" "$ROOT"
  else
    fail "Needs git, or the GitHub CLI while the repository is private"
  fi
}

fetch() {
  destination="$ROOT/tools"
  mkdir -p "$destination"

  printf '%s\n' "$PLATFORM" > "$destination/.platform"

  for tool in $TOOLS; do
    asset="$tool-$PLATFORM$EXTENSION"
    target="$destination/$tool$EXTENSION"

    from="$TOOLS_REPOSITORY"
    at="latest"
    url="https://github.com/$from/releases/latest/download/$asset"

    say "  $asset from $from"
    rm -f "$target"

    if have gh; then
      if [ "$at" = latest ]; then
        gh release download --repo "$from" --pattern "$asset" --output "$target"
      else
        gh release download "$at" --repo "$from" --pattern "$asset" --output "$target"
      fi
    elif have curl; then
      curl -fsSL -o "$target" "$url" \
        || fail "Could not download $asset. While $from is private this needs the GitHub CLI: https://cli.github.com"
    else
      fail "Needs curl, or the GitHub CLI while the repository is private"
    fi

    chmod +x "$target"
  done
}

fetch_templates() {
  destination="$ROOT/tools"
  archive="$destination/$TEMPLATES_ASSET"

  say "  $TEMPLATES_ASSET from $TOOLS_REPOSITORY"
  rm -f "$archive"

  if have gh; then
    gh release download --repo "$TOOLS_REPOSITORY" --pattern "$TEMPLATES_ASSET" --output "$archive"
  elif have curl; then
    curl -fsSL -o "$archive" "https://github.com/$TOOLS_REPOSITORY/releases/latest/download/$TEMPLATES_ASSET" \
      || fail "Could not download $TEMPLATES_ASSET. While $TOOLS_REPOSITORY is private this needs the GitHub CLI: https://cli.github.com"
  else
    fail "Needs curl, or the GitHub CLI while the repository is private"
  fi

  rm -rf "$destination/templates"
  tar -xzf "$archive" -C "$destination"
  rm -f "$archive"

  [ -d "$destination/templates/project" ] || fail "$TEMPLATES_ASSET carried no templates/project/"
}

main() {
  detect_platform
  locate_or_clone

  say "Fetching the $PLATFORM tools from $TOOLS_REPOSITORY"
  fetch
  fetch_templates

  say ""
  say "Ready. The tools are in $ROOT/tools"
  ls -lh "$ROOT/tools"
  say ""
  say "They carry no platform in their path, so a link into your PATH is the same"
  say "line on every machine:"
  say "  ln -sfn $ROOT/tools/scribe ~/.local/bin/scribe"
  say ""
  say "They are deliberately not committed, so run this again after pulling a"
  say "release that rebuilt them. tools/.platform says which build is in there."
  say ""
  say "tools/templates/ came down with them: scribe create reads it from next to"
  say "the binary, so the two are replaced together."
}

main "$@"
