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

import type { Future } from "../../async/future.ts";
import { ScribeError } from "../../error/scribe_error.ts";
import type { FileSystem, FileSystemDriver, FileSystemEntity } from "../../port/files.ts";
import { Bytes } from "../../value/bytes.ts";
import type { List } from "../../value/list.ts";

/** A path that was read while nothing was held there. */
export class MissingFileError extends ScribeError {}

const TEXT = new TextEncoder();
const BYTES = new TextDecoder();

/**
 * A file system that holds everything in a map and touches no disk.
 *
 * @remarks
 * It is what a test fills {@link FileSystems} with. Paths are taken as written, with `/` as the
 * only separator and no interpretation of `.` or `..`, because a test that needs either is a test
 * describing a real disk and should say so.
 *
 * Directories are not held as entries of their own. A directory exists as long as something under
 * it does, which is what makes {@link FileSystem.write} able to make the ones above a file without
 * anybody asking, and it means an empty directory made by hand disappears once its last file goes.
 */
export class MemoryFileSystem implements FileSystem {
  /** Every path holding bytes, and the bytes it holds. */
  readonly #held: Map<string, Uint8Array> = new Map();

  /** The directories somebody asked for that hold nothing, which nothing else would remember. */
  readonly #directories: Set<string> = new Set();

  /** How many temporary paths have been handed out, which is what keeps the next one apart. */
  #temporaries = 0;

  /** Every path holding bytes, in the order it was first written. */
  get paths(): List<string> {
    return [...this.#held.keys()];
  }

  /**
   * The bytes held at `path`, copied so a caller cannot write back into what is stored.
   *
   * @throws {MissingFileError} When nothing is held there.
   */
  read(path: string): Future<Uint8Array> {
    const held = this.#held.get(clean(path));
    if (held === undefined) {
      return Promise.reject(
        new MissingFileError(`Nothing is held at "${path}".`),
      );
    }

    return Promise.resolve(held.slice());
  }

  /**
   * What is held at `path`, read as utf-8.
   *
   * @throws {MissingFileError} When nothing is held there.
   */
  async readText(path: string): Future<string> {
    return BYTES.decode(await this.read(path));
  }

  /**
   * Holds a copy of `bytes` at `path`, and remembers the directories above it.
   *
   * The copy is what keeps a caller from changing what is stored by keeping the array it passed.
   */
  write(path: string, bytes: Uint8Array): Future<void> {
    const at = clean(path);
    this.#held.set(at, bytes.slice());
    this.#remember(parentOf(at));
    return Promise.resolve();
  }

  /** Holds `text` at `path`, written as utf-8. */
  writeText(path: string, text: string): Future<void> {
    return this.write(path, TEXT.encode(text));
  }

  /**
   * Remembers `path` and everything above it as a directory.
   *
   * It is the only way an empty one comes to exist here, since a directory otherwise exists only as
   * long as something under it does.
   */
  makeDirectory(path: string): Future<void> {
    this.#remember(clean(path));
    return Promise.resolve();
  }

  /**
   * What sits directly under `path`, files and directories alike.
   *
   * Only one level: something two segments down is reported as the directory it is under, once,
   * however many things it holds.
   *
   * @throws {MissingFileError} When `path` holds bytes rather than entries.
   */
  list(path: string): Future<List<FileSystemEntity>> {
    const at = clean(path);
    if (this.#held.has(at)) {
      return Promise.reject(
        new MissingFileError(`"${path}" holds bytes, not entries.`),
      );
    }

    const under = new Map<string, FileSystemEntity>();

    for (const [held, bytes] of this.#held) {
      const name = segmentUnder(at, held);
      if (name === null) continue;
      under.set(name, entry(name, `${at}/${name}` === held, bytes.byteLength));
    }

    for (const directory of this.#directories) {
      const name = segmentUnder(at, directory);
      if (name === null || under.has(name)) continue;
      under.set(name, entry(name, false, 0));
    }

    return Promise.resolve([...under.values()]);
  }

  /** What is at `path`, or null when nothing is, which is not a refusal here. */
  describe(path: string): Future<FileSystemEntity | null> {
    const at = clean(path);
    const bytes = this.#held.get(at);
    if (bytes !== undefined) {
      return Promise.resolve(entry(nameOf(at), true, bytes.byteLength));
    }

    if (this.#isDirectory(at)) {
      return Promise.resolve(entry(nameOf(at), false, 0));
    }

    return Promise.resolve(null);
  }

  /**
   * Takes away what is at `path`, and everything under it.
   *
   * Removing what was never there costs nothing rather than refusing, so a test tidying up does not
   * have to know what it wrote.
   */
  remove(path: string): Future<void> {
    const at = clean(path);
    this.#held.delete(at);
    this.#directories.delete(at);

    for (const held of [...this.#held.keys()]) {
      if (held.startsWith(`${at}/`)) this.#held.delete(held);
    }
    for (const directory of [...this.#directories]) {
      if (directory.startsWith(`${at}/`)) this.#directories.delete(directory);
    }

    return Promise.resolve();
  }

  /** A path nothing else holds, already written as empty. */
  async temporaryFile(): Future<string> {
    const path = `/tmp/${++this.#temporaries}`;
    await this.writeText(path, "");
    return path;
  }

  /** A directory nothing else holds, already made. */
  async temporaryDirectory(): Future<string> {
    const path = `/tmp/${++this.#temporaries}`;
    await this.makeDirectory(path);
    return path;
  }

  /**
   * Records `path` and every directory above it, stopping at the first already known.
   *
   * Stopping early is what keeps a deep write from walking to the root every time: whatever is
   * already recorded had its own parents recorded when it was.
   */
  #remember(path: string): void {
    let at = path;
    while (at !== "" && !this.#directories.has(at)) {
      this.#directories.add(at);
      at = parentOf(at);
    }
  }

  /** Whether anything makes `path` a directory: it was asked for, or something is held under it. */
  #isDirectory(path: string): boolean {
    if (this.#directories.has(path)) return true;
    return [...this.#held.keys()].some((held) => held.startsWith(`${path}/`));
  }
}

/**
 * A driver handing back one {@link MemoryFileSystem}, the same one every time.
 *
 * @example
 * ```ts ignore
 * const disk = new MemoryFileSystemDriver();
 * FileSystems.use(disk);
 * ```
 */
export class MemoryFileSystemDriver implements FileSystemDriver {
  /** The one file system this driver hands out. */
  readonly #held: MemoryFileSystem = new MemoryFileSystem();

  /**
   * The file system, which is the same one on every call.
   *
   * That is what a test wants: what it wrote through one call is there through the next, exactly as
   * a real disk behaves.
   */
  open(): MemoryFileSystem {
    return this.#held;
  }
}

function entry(name: string, isFile: boolean, bytes: number): FileSystemEntity {
  return {
    name,
    isFile,
    isDirectory: !isFile,
    size: Bytes.of(isFile ? bytes : 0),
  };
}

function clean(path: string): string {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  return trimmed === "" ? "/" : trimmed;
}

function parentOf(path: string): string {
  const cut = path.lastIndexOf("/");
  return cut <= 0 ? "" : path.slice(0, cut);
}

function nameOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function segmentUnder(directory: string, path: string): string | null {
  const prefix = directory === "/" ? "/" : `${directory}/`;
  if (!path.startsWith(prefix) || path === directory) return null;

  const rest = path.slice(prefix.length);
  const cut = rest.indexOf("/");
  return cut === -1 ? rest : rest.slice(0, cut);
}
