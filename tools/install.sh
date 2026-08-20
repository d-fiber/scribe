#!/bin/sh
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

set -eu

REPOSITORY="${SCRIBE_REPOSITORY:-d-fiber/scribe}"
TAG="${SCRIBE_TOOLS_TAG:-tools-latest}"
BRANCH="${SCRIBE_BRANCH:-main}"
TOOLS="scribe docs scribedev"
TOOLS_REPOSITORY="${SCRIBEDEV_REPOSITORY:-d-fiber/scribe_dev_tools}"

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
  [ -d "$1/.git" ] && [ -d "$1/tools" ] && [ -f "$1/VERSION" ] && [ -d "$1/host" ]
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
  destination="$ROOT/tools/$PLATFORM"
  mkdir -p "$destination"

  for tool in $TOOLS; do
    asset="$tool-$PLATFORM$EXTENSION"
    target="$destination/$tool$EXTENSION"

    case "$tool" in
      scribedev)
        from="$TOOLS_REPOSITORY"
        at="latest"
        url="https://github.com/$from/releases/latest/download/$asset"
        ;;
      *)
        from="$REPOSITORY"
        at="$TAG"
        url="https://github.com/$from/releases/download/$TAG/$asset"
        ;;
    esac

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

main() {
  detect_platform
  locate_or_clone

  say "Fetching the $PLATFORM tools from $REPOSITORY release $TAG"
  fetch

  say ""
  say "Ready. The tools are in $ROOT/tools/$PLATFORM"
  ls -lh "$ROOT/tools/$PLATFORM"
  say ""
  say "They are deliberately not committed, so run this again after pulling a"
  say "release that rebuilt them."
}

main "$@"
