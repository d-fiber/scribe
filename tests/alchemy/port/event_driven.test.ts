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

import { equals, expect, isA, isFalse, isNotNull, isTrue, throwsA } from "@scribe/alchemy/test";
import {
  cron,
  Crons,
  type DeclaredCron,
  type DeclaredHook,
  type DeclaredQueue,
  type DeclaredQueueOptions,
  type DeclaredTrigger,
  DuplicateDeclarationError,
  Duration,
  forgetCrons,
  forgetHooks,
  forgetQueues,
  forgetTriggers,
  hook,
  type HookDriver,
  Hooks,
  installCrons,
  installQueues,
  installTriggers,
  queue,
  type QueueDriver,
  Queues,
  trigger,
  Triggers,
} from "@scribe/alchemy";

class KeepingQueues implements QueueDriver {
  readonly pushed: unknown[] = [];
  readonly draining: string[] = [];
  opened = 0;

  consume<T>(options: DeclaredQueueOptions): void {
    this.draining.push(options.key);
  }

  open<T>(): DeclaredQueue<T> {
    this.opened += 1;
    const pushed = this.pushed;
    return {
      push(data: T) {
        pushed.push(data);
        return Promise.resolve();
      },
      pushMany(batch: readonly T[]) {
        pushed.push(...batch);
        return Promise.resolve();
      },
    };
  }
}

Deno.test("declaring a queue at module scope touches nothing, so an import before boot is safe", () => {
  const declared = queue<string>({ key: "audience:welcome" });

  expect(typeof declared.push, equals("function"));
  expect(() => Queues.get(), throwsA(isNotNull));
});

Deno.test("a queue opens itself at the first push, not at the declaration", async () => {
  forgetQueues();
  const kept = new KeepingQueues();
  const welcomes = queue<string>({ key: "audience:welcome" });
  Queues.use(kept);

  expect(kept.opened, equals(0), "the queue was opened before anything pushed to it");

  await welcomes.push("ada");
  expect(kept.opened, equals(1));
  expect(kept.pushed, equals(["ada"]));
});

Deno.test("a batch goes over whole, not one at a time", async () => {
  forgetQueues();
  const kept = new KeepingQueues();
  Queues.use(kept);

  await queue<string>({ key: "audience:welcome" }).pushMany(["ada", "grace"]);

  expect(kept.pushed, equals(["ada", "grace"]));
});

Deno.test("a hook opens itself at the first emit, not at the declaration", async () => {
  forgetHooks();
  const told: unknown[] = [];
  let opened = 0;
  const driver: HookDriver = {
    open<T>(): DeclaredHook<T> {
      opened += 1;
      const listeners: Array<(payload: T) => void | Promise<void>> = [];
      return {
        emit: async (payload) => {
          told.push(payload);
          for (const listen of listeners) await listen(payload);
        },
        on: (listen) => void listeners.push(listen),
      };
    },
  };

  const signedUp = hook<string>({ event: "audience.signed_up" });
  Hooks.use(driver);
  expect(opened, equals(0), "the hook was opened before anything was emitted");

  await signedUp.emit("ada");
  expect(told, equals(["ada"]));
});

Deno.test("declaring a scheduled run touches nothing, so an import before boot is safe", () => {
  forgetCrons();

  cron({ key: "audience:sweep", schedule: { every: Duration.hours(1) }, run: () => {} });

  expect(Crons.configured, isFalse, "declaring a run reached for a driver that is not there yet");
});

Deno.test("a scheduled run reaches the driver when the host installs it, and not before", () => {
  forgetCrons();
  const taken: DeclaredCron[] = [];
  Crons.use({
    schedule(options): DeclaredCron {
      const one = { key: options.key, schedule: options.schedule };
      taken.push(one);
      return one;
    },
  });

  cron({ key: "audience:sweep", schedule: { every: Duration.hours(1) }, run: () => {} });
  expect(taken.length, equals(0), "the declaration reached the driver on its own");

  installCrons();
  expect(taken.map((one) => one.key), equals(["audience:sweep"]));
});

Deno.test("a scheduled run carries what it runs, so the driver never has to find the other half", async () => {
  forgetCrons();
  let ran = false;
  let held: (() => void | Promise<void>) | null = null;
  Crons.use({
    schedule(options): DeclaredCron {
      held = options.run;
      return { key: options.key, schedule: options.schedule };
    },
  });

  cron({ key: "audience:sweep", schedule: { every: Duration.hours(1) }, run: () => void (ran = true) });
  installCrons();
  await (held as unknown as () => void | Promise<void>)();

  expect(ran, isTrue, "a scheduled run was declared with a body the driver could not reach");
});

Deno.test("a key taken twice is refused where the second declaration is written", () => {
  forgetCrons();

  cron({ key: "audience:sweep", schedule: { every: Duration.hours(1) }, run: () => {} });

  expect(
    () => cron({ key: "audience:sweep", schedule: { every: Duration.hours(2) }, run: () => {} }),
    throwsA(isA(DuplicateDeclarationError)),
    "two runs took the same key without a word",
  );
});

Deno.test("the three ways of saying when are kept apart, not folded into one", () => {
  forgetCrons();
  const taken: DeclaredCron[] = [];
  Crons.use({
    schedule(options): DeclaredCron {
      const one = { key: options.key, schedule: options.schedule };
      taken.push(one);
      return one;
    },
  });

  cron({ key: "a", schedule: { every: Duration.minutes(5) }, run: () => {} });
  cron({ key: "b", schedule: { at: { hour: 6, minute: 30 } }, run: () => {} });
  cron({ key: "c", schedule: { expression: "0 0 1 * *" }, run: () => {} });
  installCrons();

  expect("every" in taken[0].schedule, isTrue);
  expect("at" in taken[1].schedule, isTrue);
  expect("expression" in taken[2].schedule, isTrue);
});

Deno.test("declaring a watch touches nothing, so an import before boot is safe", () => {
  forgetTriggers();

  trigger("orders").onInsert(() => {});

  expect(Triggers.configured, isFalse, "declaring a watch reached for a driver that is not there yet");
});

Deno.test("a watch reaches the driver when the host installs it, and not before", () => {
  forgetTriggers();
  const watched: string[] = [];
  Triggers.use({
    watch<TRow>(table: string): DeclaredTrigger<TRow> {
      watched.push(table);
      const one: DeclaredTrigger<TRow> = {
        onInsert: () => one,
        onUpdate: () => one,
        onDelete: () => one,
        onField: () => one,
      };
      return one;
    },
  });

  trigger("orders");
  expect(watched, equals([]), "the declaration reached the driver on its own");

  installTriggers();
  expect(watched, equals(["orders"]));
});

Deno.test("what was written on a chain is played back in the order it was written", () => {
  forgetTriggers();
  const played: string[] = [];
  Triggers.use({
    watch<TRow>(): DeclaredTrigger<TRow> {
      const one: DeclaredTrigger<TRow> = {
        onInsert: () => {
          played.push("insert");
          return one;
        },
        onUpdate: () => {
          played.push("update");
          return one;
        },
        onDelete: () => {
          played.push("delete");
          return one;
        },
        onField: () => {
          played.push("field");
          return one;
        },
      };
      return one;
    },
  });

  trigger<{ status: string }>("orders")
    .onInsert(() => {})
    .onField("status", () => {}, { to: "paid" })
    .onDelete(() => {});
  installTriggers();

  expect(played, equals(["insert", "field", "delete"]));
});

Deno.test("a queue carries what drains it, and the host starts it when it installs", () => {
  forgetQueues();
  const kept = new KeepingQueues();
  Queues.use(kept);

  queue<string>({ key: "audience:welcome", handle: () => {} });
  queue<string>({ key: "audience:drained-elsewhere" });

  expect(kept.draining, equals([]), "a queue started draining before the host installed it");

  installQueues();

  expect(kept.draining, equals(["audience:welcome"]), "a queue nobody declared a handler for was drained");
});

Deno.test("a queue key taken twice is refused where the second declaration is written", () => {
  forgetQueues();

  queue<string>({ key: "audience:welcome" });

  expect(
    () => queue<string>({ key: "audience:welcome" }),
    throwsA(isA(DuplicateDeclarationError)),
    "two queues took the same key without a word",
  );
});

Deno.test("a listener written before the host is up hears what is emitted after it", async () => {
  forgetHooks();
  const told: unknown[] = [];
  const heard: unknown[] = [];
  Hooks.use({
    open<T>(): DeclaredHook<T> {
      const listeners: Array<(payload: T) => void | Promise<void>> = [];
      return {
        emit: async (payload) => {
          told.push(payload);
          for (const listen of listeners) await listen(payload);
        },
        on: (listen) => void listeners.push(listen),
      };
    },
  });

  const signedUp = hook<{ userId: string }>({ event: "audience.signed_up" });
  signedUp.on((payload) => void heard.push(payload.userId));

  await signedUp.emit({ userId: "ada" });

  expect(told.length, equals(1));
  expect(heard, equals(["ada"]), "a listener declared at module scope heard nothing");
});
