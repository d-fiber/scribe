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

import type { LoggedEntry } from "@scribe/alchemy/observe";

/** The entries of `batch`, gathered under the node each one belongs to. */
function groupByNode(
  batch: readonly LoggedEntry[],
): Map<string | null, LoggedEntry[]> {
  const grouped = new Map<string | null, LoggedEntry[]>();

  for (const entry of batch) {
    const node = entry.node ?? null;
    const bucket = grouped.get(node);
    if (bucket) bucket.push(entry);
    else grouped.set(node, [entry]);
  }

  return grouped;
}

/**
 * How many entries one queue message carries at most.
 *
 * A request log entry is a couple of hundred bytes, so this is well under the
 * megabyte NATS accepts on a single message, and it is what bounds the memory
 * a burst can hold: past this the buffer publishes rather than grows.
 */
const MAX_BUFFERED = 500;

/**
 * How long an entry waits for company before it is published on its own.
 *
 * It is the delay a lone entry costs on a quiet host, and it is the window of
 * entries a process killed without warning loses. A second buys the grouping
 * that matters under load without making a local stack feel stuck.
 */
const LINGER_MS = 1_000;

/**
 * Entries held in this process until there are enough of them to be worth a
 * publish.
 *
 * The request log runs on every request, so publishing one entry per request
 * is one NATS round trip per request. The queue's own `lingerMs` groups the
 * *consumption* of those messages, never their production: only a buffer on
 * this side turns a thousand publishes into two.
 *
 * The trade is deliberate and bounded: a process killed between two flushes
 * loses at most {@link MAX_BUFFERED} entries or {@link LINGER_MS} of them,
 * whichever comes first. `flush` is called on shutdown so an orderly stop
 * loses none.
 */
export class LogBuffer {
  readonly #publish: (
    node: string | null,
    entries: readonly LoggedEntry[],
  ) => Promise<unknown>;

  #entries: LoggedEntry[] = [];
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    publish: (node: string | null, entries: readonly LoggedEntry[]) => Promise<unknown>,
  ) {
    this.#publish = publish;
  }

  /** How many entries are waiting to be published. */
  get pending(): number {
    return this.#entries.length;
  }

  /**
   * Holds an entry, and publishes the batch once it is full.
   *
   * Returns the publish it started, or `null` when the entry only joined the
   * batch. A caller under a runtime that suspends on idle passes what it gets
   * to `waitUntil`, so the process stays alive long enough to publish.
   */
  record(entry: LoggedEntry): Promise<void> | null {
    this.#entries.push(entry);

    if (this.#entries.length >= MAX_BUFFERED) return this.flush();

    this.#arm();
    return null;
  }

  /**
   * Publishes what is held, one batch per node, and forgets it either way.
   *
   * The split by node is not cosmetic: a node that declared a sink takes
   * delivery of its own entries and of nobody else's, so a batch that mixed two
   * nodes could not be routed at all.
   *
   * A failed publish drops its batch instead of putting it back: keeping it
   * would grow the buffer for as long as the outage lasts, and access logs are
   * not worth taking the process down with them. One node failing does not stop
   * the others.
   */
  async flush(): Promise<void> {
    this.#disarm();
    if (this.#entries.length === 0) return;

    const batch = this.#entries;
    this.#entries = [];

    for (const [node, entries] of groupByNode(batch)) {
      try {
        await this.#publish(node, entries);
      } catch (error) {
        console.error(
          `[log-buffer] dropped ${entries.length} entries of ${node ?? "no node"}:`,
          error,
        );
      }
    }
  }

  #arm(): void {
    if (this.#timer !== null) return;

    this.#timer = setTimeout(() => {
      this.#timer = null;
      void this.flush();
    }, LINGER_MS);
  }

  #disarm(): void {
    if (this.#timer === null) return;

    clearTimeout(this.#timer);
    this.#timer = null;
  }
}
