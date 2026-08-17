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

import { assertEquals, assertThrows } from "@std/assert";
import { create } from "@bufbuild/protobuf";
import {
  describeWorker,
  type DiscoveredLogSink,
  type DiscoveredModule,
  type LoggedEntry,
  LogSink,
  Node,
  RoutingError,
  ScribeServer,
} from "../mod.ts";
import { deliverLogs } from "../src/runtime/dispatch.ts";
import { LogDeliverySchema, LogEntrySchema, LogLevel } from "../gen/scribe/protocol/logs_pb.ts";

/**
 * What the sinks of this file were handed, in order.
 *
 * The registry builds a sink itself, from the class a `_log.ts` exports, so a
 * test cannot hold the instance it wants to read. The sinks write here instead,
 * under the name of the file they stand for.
 */
const delivered: { sink: string; entries: readonly LoggedEntry[] }[] = [];

/** Stands for `lib/_log.ts`. */
class ProjectLogs extends LogSink {
  protected override blockSize(): number {
    return 0;
  }

  protected override block(entries: readonly LoggedEntry[]): void {
    delivered.push({ sink: "root", entries });
  }
}

/** Stands for `lib/src/app/_log.ts`. */
class AppLogs extends LogSink {
  protected override blockSize(): number {
    return 0;
  }

  protected override block(entries: readonly LoggedEntry[]): void {
    delivered.push({ sink: "app", entries });
  }
}

class BrokenLogs extends LogSink {
  protected override blockSize(): number {
    return 0;
  }

  protected override block(): void {
    throw new Error("the collector is down");
  }
}

function reset(): void {
  delivered.length = 0;
}

function entriesOf(sink: string): readonly LoggedEntry[] {
  return delivered.filter((batch) => batch.sink === sink).flatMap((batch) => [...batch.entries]);
}

function actionsOf(sink: string): readonly string[] {
  return entriesOf(sink).map((entry) => entry.action);
}

function sink(node: string | null, module: DiscoveredModule): DiscoveredLogSink {
  return { node, file: node === null ? "lib/_log.ts" : `lib/src/${node}/_log.ts`, module };
}

/** A project of two nodes, taking the `_log.ts` files it was given. */
function projectWith(logSinks: readonly DiscoveredLogSink[]): ScribeServer {
  return new ScribeServer({ routes: [], logSinks })
    .addNode(new Node({ name: "app", public: true }))
    .addNode(new Node({ name: "admin", public: false }));
}

const BOTH: readonly DiscoveredLogSink[] = [
  sink(null, { ProjectLogs }),
  sink("app", { AppLogs }),
];

function delivery(node: string, actions: readonly string[]) {
  return create(LogDeliverySchema, {
    node,
    entries: actions.map((action) =>
      create(LogEntrySchema, {
        level: LogLevel.INFO,
        action,
        node,
        timestamp: BigInt(1_700_000_000_000),
      })
    ),
  });
}

Deno.test("the manifest names every node that declared a sink, and the root one", () => {
  const manifest = describeWorker(projectWith(BOTH).definition());

  assertEquals(
    manifest.nodes.map((node) => [node.name, node.logSink]),
    [["app", true], ["admin", false]],
  );
  assertEquals(manifest.rootLogSink, true);
});

Deno.test("a project with no _log.ts declares none, and is delivered nothing", async () => {
  reset();
  const definition = projectWith([]).definition();
  const manifest = describeWorker(definition);

  assertEquals(manifest.nodes.map((node) => node.logSink), [false, false]);
  assertEquals(manifest.rootLogSink, false);

  await deliverLogs(definition, delivery("app", ["GET /brand"]));

  assertEquals(delivered, []);
});

Deno.test("a node's entries go to that node's sink and to no other", async () => {
  reset();
  const definition = projectWith(BOTH).definition();

  await deliverLogs(definition, delivery("app", ["GET /brand", "POST /brand"]));

  assertEquals(actionsOf("app"), ["GET /brand", "POST /brand"]);
  assertEquals(actionsOf("root"), []);
});

Deno.test("a node with no _log.ts of its own falls back to the root sink", async () => {
  reset();
  const definition = projectWith(BOTH).definition();

  await deliverLogs(definition, delivery("admin", ["GET /users"]));

  assertEquals(actionsOf("root"), ["GET /users"]);
  assertEquals(actionsOf("app"), []);
});

Deno.test("what belongs to no node reaches the root sink alone", async () => {
  reset();
  const definition = projectWith(BOTH).definition();

  await deliverLogs(definition, delivery("", ["GET /health"]));

  assertEquals(actionsOf("root"), ["GET /health"]);
  assertEquals(entriesOf("root")[0].node, null);
  assertEquals(actionsOf("app"), []);
});

Deno.test("without a root _log.ts, what no node claimed is delivered nowhere", async () => {
  reset();
  const definition = projectWith([sink("app", { AppLogs })]).definition();

  await deliverLogs(definition, delivery("admin", ["GET /users"]));
  await deliverLogs(definition, delivery("", ["GET /health"]));

  assertEquals(delivered, []);
});

Deno.test("an entry arrives stripped of the empty strings the wire carries", async () => {
  reset();
  const definition = projectWith([sink(null, { ProjectLogs })]).definition();

  await deliverLogs(
    definition,
    create(LogDeliverySchema, {
      node: "",
      entries: [
        create(LogEntrySchema, {
          level: LogLevel.WARN,
          action: "GET /brand",
          actorId: "user-1",
          timestamp: BigInt(1_700_000_000_000),
        }),
      ],
    }),
  );

  assertEquals(entriesOf("root")[0], {
    level: "warn",
    node: null,
    action: "GET /brand",
    actorType: null,
    actorId: "user-1",
    metadata: {},
    timestamp: 1_700_000_000_000,
    traceId: null,
    invocationId: null,
  });
});

Deno.test("a sink that throws does not fail the delivery", async () => {
  const definition = projectWith([sink(null, { BrokenLogs })]).definition();

  await deliverLogs(definition, delivery("", ["GET /health"]));
});

Deno.test("a _log.ts under a folder no addNode() opens is refused", () => {
  assertThrows(
    () =>
      new ScribeServer({ routes: [], logSinks: [sink("partners", { AppLogs })] })
        .addNode(new Node({ name: "app", public: true }))
        .definition(),
    RoutingError,
    "partners",
  );
});

Deno.test("a _log.ts that exports no sink is a project that has not written one", () => {
  const manifest = describeWorker(projectWith([sink("app", {})]).definition());

  assertEquals(manifest.nodes.map((node) => node.logSink), [false, false]);
  assertEquals(manifest.rootLogSink, false);
});

/** A sink that keeps what each of its two ways in was handed. */
class Blocks extends LogSink {
  readonly seen: string[] = [];
  readonly blocks: string[][] = [];

  constructor(readonly size: number) {
    super();
  }

  protected override blockSize(): number {
    return this.size;
  }

  protected override each(entry: LoggedEntry): void {
    this.seen.push(entry.action);
  }

  protected override block(entries: readonly LoggedEntry[]): void {
    this.blocks.push(entries.map((entry) => entry.action));
  }
}

/** A sink that takes the size the framework picked for it. */
class Default extends LogSink {
  readonly blocks: string[][] = [];

  protected override block(entries: readonly LoggedEntry[]): void {
    this.blocks.push(entries.map((entry) => entry.action));
  }
}

/** A sink that reads nothing, which is a project that declared a class and stopped there. */
class Silent extends LogSink {}

function logged(action: string): LoggedEntry {
  return {
    level: "info",
    node: null,
    action,
    actorType: null,
    actorId: null,
    metadata: {},
    timestamp: 1_700_000_000_000,
    traceId: null,
    invocationId: null,
  };
}

function actions(count: number, from = 0): LoggedEntry[] {
  return Array.from({ length: count }, (_, index) => logged(`GET /${from + index}`));
}

Deno.test("each sees every entry, in the order it arrived", async () => {
  const sink = new Blocks(0);

  await sink.receive(actions(3));

  assertEquals(sink.seen, ["GET /0", "GET /1", "GET /2"]);
});

Deno.test("a block is handed over only once it is full", async () => {
  const sink = new Blocks(3);

  await sink.receive(actions(2));
  assertEquals(sink.blocks, []);

  await sink.receive(actions(1, 2));
  assertEquals(sink.blocks, [["GET /0", "GET /1", "GET /2"]]);
});

Deno.test("a delivery longer than the block is cut, and the remainder waits", async () => {
  const sink = new Blocks(2);

  await sink.receive(actions(5));

  assertEquals(sink.blocks, [["GET /0", "GET /1"], ["GET /2", "GET /3"]]);

  await sink.flush();

  assertEquals(sink.blocks.at(-1), ["GET /4"]);
});

Deno.test("flushing an empty sink hands over nothing", async () => {
  const sink = new Blocks(2);

  await sink.flush();

  assertEquals(sink.blocks, []);
});

Deno.test("a block size of zero hands over each delivery as it arrives", async () => {
  const sink = new Blocks(0);

  await sink.receive(actions(2));
  await sink.receive(actions(1, 2));

  assertEquals(sink.blocks, [["GET /0", "GET /1"], ["GET /2"]]);
});

Deno.test("a sink that names no size gathers a hundred entries", async () => {
  const sink = new Default();

  await sink.receive(actions(99));
  assertEquals(sink.blocks, []);

  await sink.receive(actions(1, 99));
  assertEquals(sink.blocks.length, 1);
  assertEquals(sink.blocks[0].length, 100);
});

Deno.test("a sink that reads neither way drops what it takes without failing", async () => {
  const sink = new Silent();

  await sink.receive(actions(150));
  await sink.flush();
});
