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

import type { EventScope } from "../contracts/access.ts";
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
  readonly entity: string;
  readonly events: readonly string[];
  readonly scope: EventScope;
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
