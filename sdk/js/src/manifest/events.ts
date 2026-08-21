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
  readonly messageId: string;
  readonly payload: T;
  readonly attempt: number;
  readonly enqueuedAt: number;
}

export type QueueHandler<T> = (
  messages: readonly QueueMessage<T>[],
) => Promise<readonly string[]> | readonly string[];

export interface WorkerQueue<T = unknown> {
  readonly name: string;
  readonly batchSize: number;
  readonly visibilityTimeout: Time;
  readonly maxAttempts: number;
  readonly handler: QueueHandler<T>;
}

export interface HookOutcome {
  readonly halted?: boolean;
  readonly mutation?: unknown;
}

export type HookHandler = (
  payload: unknown,
) => Promise<HookOutcome | void> | HookOutcome | void;

export interface WorkerHook {
  readonly event: string;
  readonly priority?: number;
  readonly handler: HookHandler;
}

export type CronHandler = () => Promise<void> | void;

export interface WorkerCron {
  readonly name: string;
  readonly schedule: string;
  readonly handler: CronHandler;
}

export interface WorkerSearcher {
  readonly entity: string;
  readonly index: string;
  readonly mappings?: unknown;
  readonly settings?: unknown;
}

export interface WorkerRealtime {
  readonly channel: string;
  readonly actions: readonly string[];
  readonly listen: Listen;
}

export interface WorkerStorage {
  readonly folder: string;
  readonly pathTemplate: string;
  readonly maxSize: Size;
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
