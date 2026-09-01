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

import { Slot } from "../bind/slot.ts";

/** What draws the identifiers {@link Uuid} hands out. */
export interface UuidSource {
  /** An identifier drawn at random, in the shape version 4 describes. */
  v4(): string;

  /** An identifier that carries the instant it was drawn, in the shape version 6 describes. */
  v6(): string;
}

/**
 * What {@link Uuid} reads.
 *
 * @remarks
 * Drawing at random is reaching the platform, and nothing here reaches the platform, so the host
 * fills this once with something that does. A test fills it with something that counts, which is
 * what lets a case name the identifier it expects instead of reading back whatever was drawn.
 */
export const Uuids: Slot<UuidSource> = new Slot<UuidSource>("Uuids");

/**
 * An identifier nothing else carries.
 *
 * @remarks
 * It is the shape every identifying column of the schema holds, so a package that makes one makes
 * this rather than inventing a format of its own.
 *
 * @example
 * ```ts ignore
 * await store.put({ id: Uuid.v4(), name });
 * ```
 */
export class Uuid {
  /**
   * Refuses to build one.
   *
   * There is nothing to hold: an identifier is a string, and this class exists to name the two ways
   * of drawing one rather than to be instantiated.
   */
  private constructor() {}

  /**
   * An identifier drawn at random.
   *
   * It reads {@link Uuids}, so it refuses until something has filled it. A process that never said
   * where its identifiers come from has not been wired, and drawing one anyway would hide it.
   */
  static v4(): string {
    return Uuids.get().v4();
  }

  /**
   * An identifier that carries the instant it was drawn, so identifiers drawn later sort after.
   *
   * @remarks
   * It is the one to reach for on a column an index is kept on. Random identifiers land all over
   * that index, so every insert dirties another page of it; these land at the end, one after
   * another, which is what keeps the index compact as a table grows.
   *
   * What it costs is that the identifier says when the row was made, to anybody who receives it.
   * When that matters, {@link v4} says nothing.
   */
  static v6(): string {
    return Uuids.get().v6();
  }
}
