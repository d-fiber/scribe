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

import type { List, UnmodifiableList } from "./list.ts";

/**
 * What a caller asks for when it wants one page of a longer list.
 *
 * @remarks
 * It is the other half of {@link Pagination}: this is the question, that is the answer. Both
 * fields are optional because a caller that names neither wants the first page at whatever size
 * the thing it is asking has decided, and a size nobody chose is not the same as a size of zero.
 */
export interface PageRequest {
  /** How many items to skip before the page starts. From the beginning when left out. */
  readonly offset?: number;

  /** How many items the page holds at most. The default of whatever is asked, when left out. */
  readonly size?: number;
}

/** The shape a page takes once it has left the process, which is not the shape it has inside. */
export interface PaginationJson<T> {
  /** The rows of this page, in the order they were read. */
  items: List<T>;

  /** What a caller needs to ask for the next page. */
  pagination: {
    /** How many rows were skipped to reach this page. */
    offset: number;

    /** How many rows are known so far. It is a floor, not a count. */
    total: number;

    /** Whether asking again past this page would answer anything. */
    has_more: boolean;
  };
}

/**
 * A page of rows, and what a caller needs to ask for the next one.
 *
 * @remarks
 * It is built one of two ways and never by hand, so a page cannot be assembled with a `total` that
 * disagrees with the rows beside it.
 *
 * The fields are named the way everything here is named. The shape that goes out is another thing,
 * and it lives in {@link toJson} alone, so a caller reading a page inside the process never has to
 * know how it will be spelled on the way out.
 */
export class Pagination<T> {
  /** The rows of this page, in the order they were read. */
  readonly items: UnmodifiableList<T>;

  /** How many rows were skipped to reach this page. */
  readonly offset: number;

  /**
   * How many rows are known so far.
   *
   * @remarks
   * It is a floor and not a count: it says how many have been seen up to and including this page,
   * plus one when there is more. A true count would cost a scan of the table, and a caller that
   * pages does not need one.
   */
  readonly total: number;

  /** Whether asking again past this page would answer anything. */
  readonly hasMore: boolean;

  /**
   * Builds a page from its four fields.
   *
   * It is private so a page comes from one of the two factories, which are the only two ways a page
   * is ever known: it was read with one row to spare, or its total was counted.
   */
  private constructor(items: UnmodifiableList<T>, offset: number, total: number, hasMore: boolean) {
    this.items = items;
    this.offset = offset;
    this.total = total;
    this.hasMore = hasMore;
  }

  /**
   * A page holding nothing.
   *
   * @remarks
   * An endpoint answers this rather than an empty body, so a caller reads the same shape whether or
   * not there was anything to send.
   */
  static empty<T>(): Pagination<T> {
    return new Pagination<T>([], 0, 0, false);
  }

  /**
   * The page `rows` holds.
   *
   * @remarks
   * It expects `rows` to have been read one longer than `size`, and that extra row is the whole
   * mechanism: its presence is what says there is a page after this one, and it is dropped rather
   * than sent.
   *
   * @param rows - What was read, one longer than `size` when there is more.
   * @param offset - How many rows were skipped to reach this page.
   * @param size - How many rows a page holds.
   */
  static of<T>(rows: UnmodifiableList<T>, offset: number, size: number): Pagination<T> {
    const hasMore = rows.length > size;
    const items = hasMore ? rows.slice(0, size) : rows;
    return new Pagination<T>(items, offset, offset + items.length + (hasMore ? 1 : 0), hasMore);
  }

  /** This page in the shape it goes out in. */
  toJson(): PaginationJson<T> {
    return {
      items: [...this.items],
      pagination: { offset: this.offset, total: this.total, has_more: this.hasMore },
    };
  }
}
