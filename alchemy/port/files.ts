// Copyright (C) 2026 Fiber
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
// LICENSE file, the LICENSE file governs.

import type { Future } from "../async/future.ts";
import { Slot } from "../bind/slot.ts";
import type { Bytes } from "../value/bytes.ts";
import type { List } from "../value/list.ts";

/** What a name in a directory turns out to be. */
/**
 * One thing a listing found, whether it holds bytes or other things.
 *
 * @remarks
 * It carries the name Dart gives what a directory listing answers. What it does not carry is a
 * path: a listing is read against the directory it was asked for, and rebuilding a path from a
 * name is the caller's business, which is what keeps this free of a separator convention.
 */
export interface FileSystemEntity {
  /** The last segment of the path, without the directory that holds it. */
  readonly name: string;

  /** Whether this entry holds bytes rather than other entries. */
  readonly isFile: boolean;

  /** Whether this entry holds other entries rather than bytes. */
  readonly isDirectory: boolean;

  /** How much this entry holds. It is zero for a directory, whatever the platform reports. */
  readonly size: Bytes;
}

/**
 * Somewhere bytes are held under a path.
 *
 * @remarks
 * A package never names a file system. It asks {@link FileSystems} for one and talks to this, so
 * the same code runs against a disk in production and against a map in a test. Every path is taken
 * as the host reads it, and nothing here interprets one.
 *
 * A path that names nothing makes a read throw and makes {@link describe} answer null, which is the
 * same split the database port draws: a caller asking for bytes has no useful answer to give back,
 * and a caller asking whether something is there does.
 */
export interface FileSystem {
  /** The bytes held at `path`. Throws when nothing is held there. */
  read(path: string): Future<Uint8Array>;

  /** The text held at `path`, decoded as UTF-8. Throws when nothing is held there. */
  readText(path: string): Future<string>;

  /** Holds `bytes` at `path`, over whatever was there, making the directories above it if needed. */
  write(path: string, bytes: Uint8Array): Future<void>;

  /** Holds `text` at `path` as UTF-8, over whatever was there, making the directories above it. */
  writeText(path: string, text: string): Future<void>;

  /** Makes the directory at `path` and every one above it, and does nothing when it is already there. */
  makeDirectory(path: string): Future<void>;

  /** What the directory at `path` holds, in no particular order. Throws when it is not a directory. */
  list(path: string): Future<List<FileSystemEntity>>;

  /** What is at `path`, or null when nothing is. */
  describe(path: string): Future<FileSystemEntity | null>;

  /** Forgets what is at `path`, a directory and everything under it included, and does nothing when nothing is. */
  remove(path: string): Future<void>;

  /** The path of a file nothing else holds, made empty and left for the caller to fill. */
  temporaryFile(): Future<string>;

  /** The path of a directory nothing else holds, made empty. */
  temporaryDirectory(): Future<string>;
}

/** What opens a file system. */
export interface FileSystemDriver {
  /** Opens the file system this driver stands for. Opening it twice answers the same one. */
  open(): FileSystem;
}

/**
 * What answers a package that needs to reach a file.
 *
 * @remarks
 * The host fills this once, at boot, with whatever it runs against, and a test fills it with
 * something that holds bytes in a map. It is the only way a package touches a file, which is what
 * lets one be written without the framework and tested without a disk.
 *
 * Unlike the cache, the rate limiter and the table, there is no declaring function next to it and
 * no deferred object behind it, and the absence is deliberate rather than missing. Those three are
 * declared at module scope, which is evaluated at import, so they need something that records what
 * was asked and reaches nothing. A file system is not declared, it is used, and a caller reaches it
 * while a request is in flight, by which time the host is up.
 *
 * @example
 * ```ts
 * const manifest = await FileSystems.get().open().readText("package.yaml");
 * ```
 */
export const FileSystems: Slot<FileSystemDriver> = new Slot<FileSystemDriver>("FileSystems");
