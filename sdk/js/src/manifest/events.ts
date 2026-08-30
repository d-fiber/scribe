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

export interface HookOutcome {
  /** Whether this outcome stops the rest of the trigger chain from running. */
  readonly halted?: boolean;

  /** The replacement the row is written with instead of the row the trigger received. */
  readonly mutation?: unknown;
}

export type HookHandler = (
  payload: unknown,
) => Promise<HookOutcome | void> | HookOutcome | void;

export interface WorkerHook {
  /** The database event this hook reacts to, matching a row insert, update or delete. */
  readonly event: string;

  /** Where this hook runs relative to the other hooks on the same event. Lower runs first. */
  readonly priority?: number;

  /** The function that reacts to the event. */
  readonly handler: HookHandler;
}

export type CronHandler = () => Promise<void> | void;

export interface WorkerCron {
  /** The cron's name, used to address it and to derive its identifier. */
  readonly name: string;

  /** The cron expression that decides when this job runs. */
  readonly schedule: string;

  /** The function the schedule invokes. */
  readonly handler: CronHandler;
}

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

export interface WorkerRealtime {
  /** The name of the channel this declaration broadcasts on. */
  readonly channel: string;

  /** The row events this channel broadcasts. */
  readonly actions: readonly string[];

  /** How open this channel's own broadcast is, before any grant is written. */
  readonly listen: Listen;
}

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

export function defineQueue<T>(queue: WorkerQueue<T>): WorkerQueue<T> {
  return queue;
}

export function defineHook(hook: WorkerHook): WorkerHook {
  return hook;
}

export function defineCron(cron: WorkerCron): WorkerCron {
  return cron;
}

export function defineSearcher(searcher: WorkerSearcher): WorkerSearcher {
  return searcher;
}

export function defineRealtime(realtime: WorkerRealtime): WorkerRealtime {
  return realtime;
}

export function defineStorage(storage: WorkerStorage): WorkerStorage {
  return storage;
}

export function queueIdOf(queue: WorkerQueue<never>): string {
  return `queue:${queue.name}`;
}

export function hookIdOf(hook: WorkerHook, ordinal: number): string {
  return `hook:${hook.event}:${ordinal}`;
}

export function cronIdOf(cron: WorkerCron): string {
  return `cron:${cron.name}`;
}
