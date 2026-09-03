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

import type { Listen } from "../contracts/access.ts";
import type { Size, Time } from "../contracts/time.ts";

/** A message as a queue handler sees it. */
export interface QueueMessage<T> {
  /** The identifier the queue assigned when this message was enqueued. */
  readonly messageId: string;

  /** The payload the producer enqueued, decoded into the handler's own type. */
  readonly payload: T;

  /** How many times the queue has delivered this message, starting at one. */
  readonly attempt: number;

  /** When this message was enqueued, as milliseconds since the Unix epoch. */
  readonly enqueuedAt: number;
}

export type QueueHandler<T> = (
  messages: readonly QueueMessage<T>[],
) => Promise<readonly string[]> | readonly string[];

/** A queue a worker declares: its delivery shape, and the handler that processes a batch. */
export interface WorkerQueue<T = unknown> {
  /** The queue's name, used to address it and to derive its identifier. */
  readonly name: string;

  /** How many messages the queue delivers to the handler in one call, at most. */
  readonly batchSize: number;

  /** How long a delivered message stays hidden from other consumers before it is considered failed. */
  readonly visibilityTimeout: Time;

  /** How many delivery attempts a message gets before the queue gives up on it. */
  readonly maxAttempts: number;

  /** The function that processes a batch of messages. */
  readonly handler: QueueHandler<T>;
}

/** What a hook handler may ask for beyond just running: halting the chain, or rewriting the row. */
export interface HookOutcome {
  /** Whether this outcome stops the rest of the trigger chain from running. */
  readonly halted?: boolean;

  /** The replacement the row is written with instead of the row the trigger received. */
  readonly mutation?: unknown;
}

export type HookHandler = (
  payload: unknown,
) => Promise<HookOutcome | void> | HookOutcome | void;

/** A hook a worker declares: the row event it reacts to, and the handler that runs on it. */
export interface WorkerHook {
  /** The database event this hook reacts to, matching a row insert, update or delete. */
  readonly event: string;

  /** Where this hook runs relative to the other hooks on the same event. Lower runs first. */
  readonly priority?: number;

  /** The function that reacts to the event. */
  readonly handler: HookHandler;
}

export type CronHandler = () => Promise<void> | void;

/** A scheduled job a worker declares: its schedule, and the handler it invokes. */
export interface WorkerCron {
  /** The cron's name, used to address it and to derive its identifier. */
  readonly name: string;

  /** The cron expression that decides when this job runs. */
  readonly schedule: string;

  /** The function the schedule invokes. */
  readonly handler: CronHandler;
}

/** A search index a worker declares: what it indexes, and the engine-specific shape it indexes with. */
export interface WorkerSearcher {
  /** The name of the table or view this searcher indexes. */
  readonly entity: string;

  /** The name of the search index this searcher writes into. */
  readonly index: string;

  /** The index's field mappings, in the search engine's own shape. Left to the engine's default when omitted. */
  readonly mappings?: unknown;

  /** The index's settings, in the search engine's own shape. Left to the engine's default when omitted. */
  readonly settings?: unknown;
}

/** A broadcast channel a worker declares: what it carries, and how open it is by default. */
export interface WorkerRealtime {
  /** The name of the channel this declaration broadcasts on. */
  readonly channel: string;

  /** The row events this channel broadcasts. */
  readonly actions: readonly string[];

  /** How open this channel's own broadcast is, before any grant is written. */
  readonly listen: Listen;
}

/** A storage folder a worker declares: where objects resolve to, and what an upload must satisfy. */
export interface WorkerStorage {
  /** The name this storage folder is declared and addressed under. */
  readonly folder: string;

  /** The path template objects in this folder resolve against, placeholders included. */
  readonly pathTemplate: string;

  /** The largest object this folder accepts. A write past it is refused. */
  readonly maxSize: Size;

  /** The content types this folder accepts. A write with any other type is refused. */
  readonly mimeTypes: readonly string[];
}

/**
 * `queue` unchanged, typed as a {@link WorkerQueue}.
 *
 * @remarks
 * A worker author writes the declaration as a plain object literal, and this exists so that
 * literal gets checked and autocompleted against `WorkerQueue<T>` at the call site, the way
 * `T` is inferred from `payload`'s shape, rather than the author having to annotate the object
 * by hand or the framework accepting whatever shape shows up.
 */
export function defineQueue<T>(queue: WorkerQueue<T>): WorkerQueue<T> {
  return queue;
}

/** The {@link defineQueue} of a hook declaration. */
export function defineHook(hook: WorkerHook): WorkerHook {
  return hook;
}

/** The {@link defineQueue} of a cron declaration. */
export function defineCron(cron: WorkerCron): WorkerCron {
  return cron;
}

/** The {@link defineQueue} of a searcher declaration. */
export function defineSearcher(searcher: WorkerSearcher): WorkerSearcher {
  return searcher;
}

/** The {@link defineQueue} of a realtime channel declaration. */
export function defineRealtime(realtime: WorkerRealtime): WorkerRealtime {
  return realtime;
}

/** The {@link defineQueue} of a storage folder declaration. */
export function defineStorage(storage: WorkerStorage): WorkerStorage {
  return storage;
}

/** The identifier `WorkerDefinition` indexes `queue` by, its name prefixed so it cannot collide with a hook or cron of the same name. */
export function queueIdOf(queue: WorkerQueue<never>): string {
  return `queue:${queue.name}`;
}

/**
 * The identifier `WorkerDefinition` indexes `hook` by.
 *
 * @remarks
 * Several hooks can react to the same `event` at different priorities, so the event name alone
 * would collide; `ordinal`, the hook's position in the worker's own declaration order, is what
 * keeps each one addressable.
 */
export function hookIdOf(hook: WorkerHook, ordinal: number): string {
  return `hook:${hook.event}:${ordinal}`;
}

/** The identifier `WorkerDefinition` indexes `cron` by, its name prefixed so it cannot collide with a queue or hook of the same name. */
export function cronIdOf(cron: WorkerCron): string {
  return `cron:${cron.name}`;
}
