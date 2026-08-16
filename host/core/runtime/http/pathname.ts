// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

const SLASH = 47;
const QUESTION_MARK = 63;
const HASH = 35;

function isPlainPathByte(code: number): boolean {
  return (code >= 97 && code <= 122) ||
    (code >= 65 && code <= 90) ||
    (code >= 48 && code <= 57) ||
    code === SLASH || code === 45 || code === 95 || code === 126;
}

function pathStartOf(url: string): number {
  const schemeEnd = url.indexOf("://");
  const hostStart = schemeEnd === -1 ? 0 : schemeEnd + 3;
  return url.indexOf("/", hostStart);
}

export function pathnameOf(url: string): string {
  const pathStart = pathStartOf(url);
  if (pathStart === -1) return "/";

  let end = url.length;
  for (let at = pathStart; at < end; at++) {
    const code = url.charCodeAt(at);
    if (code === QUESTION_MARK || code === HASH) {
      end = at;
      break;
    }
  }

  for (let at = pathStart; at < end; at++) {
    if (!isPlainPathByte(url.charCodeAt(at))) return new URL(url).pathname;
  }
  return url.slice(pathStart, end);
}

export function originOf(url: string): string {
  const pathStart = pathStartOf(url);
  return pathStart === -1 ? url : url.slice(0, pathStart);
}

export function searchOf(url: string): string {
  const pathStart = pathStartOf(url);
  const from = pathStart === -1 ? 0 : pathStart;

  const fragment = url.indexOf("#", from);
  const end = fragment === -1 ? url.length : fragment;

  const query = url.indexOf("?", from);
  if (query === -1 || query >= end || end - query === 1) return "";
  return url.slice(query, end);
}

function segmentStart(pathname: string): number {
  let at = 0;
  while (at < pathname.length && pathname.charCodeAt(at) === SLASH) at++;
  return at;
}

function segmentEnd(pathname: string, from: number): number {
  let at = from;
  while (at < pathname.length && pathname.charCodeAt(at) !== SLASH) at++;
  return at;
}

export function firstSegmentOf(pathname: string): string {
  const start = segmentStart(pathname);
  return pathname.slice(start, segmentEnd(pathname, start));
}

function hasEmptySegment(rest: string): boolean {
  if (rest.length > 1 && rest.charCodeAt(rest.length - 1) === SLASH) return true;
  for (let at = 1; at < rest.length; at++) {
    if (rest.charCodeAt(at) === SLASH && rest.charCodeAt(at - 1) === SLASH) {
      return true;
    }
  }
  return false;
}

function withoutEmptySegments(rest: string): string {
  return "/" + rest.split("/").filter(Boolean).join("/");
}

export function stripPrefix(pathname: string, prefix: string): string {
  const start = segmentStart(pathname);
  const end = segmentEnd(pathname, start);
  if (end - start !== prefix.length) return pathname;
  if (!pathname.startsWith(prefix, start)) return pathname;

  const rest = pathname.slice(end);
  if (rest.length === 0) return "/";
  return hasEmptySegment(rest) ? withoutEmptySegments(rest) : rest;
}
