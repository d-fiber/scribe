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

import "@scribe/scholium/runner.ts";
import { equals, expect, Scribe } from "@scribe/alchemy/test";
import type { List, ProtoEnumBuilder, ProtoMessageBuilder, ProtoServiceBuilder } from "@scribe/alchemy";
import { declaredNodes, Proto, ProtoBuilder, protocol, ProtoEnum, ProtoMessage, ProtoService } from "@scribe/alchemy";

class Bare extends ProtoBuilder {
  imports(): List<string> {
    return [];
  }

  open(name: string) {
    return this.builder(name);
  }

  openEnum() {
    return this.builder((e) => e.name("Isolation").values((v) => [v.value("ISOLATION_UNSPECIFIED").number(0)]));
  }
}

Scribe.test("builder(name).fields(...) closes as a message", () => {
  const message = new Bare().open("Query").fields((f) => ({ sql: f.string().number(1) }));

  expect(message.kind, equals("message"));
  expect(message.name, equals("Query"));
});

Scribe.test("builder(name).rpc(...) closes as a service", () => {
  const service = new Bare().open("Database").rpc((r) => [r.rpc("Execute", "Query", "QueryResult")]);

  expect(
    service.declaration,
    equals({
      kind: "service",
      name: "Database",
      rpcs: [{ name: "Execute", request: "Query", response: "QueryResult" }],
    }),
  );
});

Scribe.test("rpc((r) => [...]) accumulates every entry the callback answers, in order", () => {
  const service = new Bare().open("Database").rpc((r) => [
    r.rpc("Execute", "Query", "QueryResult"),
    r.rpc("ExecuteBatch", "QueryBatch", "QueryBatchResult"),
  ]);

  expect(
    service.declaration.rpcs,
    equals([
      { name: "Execute", request: "Query", response: "QueryResult" },
      { name: "ExecuteBatch", request: "QueryBatch", response: "QueryBatchResult" },
    ]),
  );
});

Scribe.test("builder((e) => ...) closes as an enum", () => {
  const declared = new Bare().openEnum();

  expect(declared.kind, equals("enum"));
  expect(declared.name, equals("Isolation"));
});

@Proto("database")
class DatabaseProtocol extends ProtoBuilder {
  imports(): List<string> {
    return ["scribe/protocol/common.proto"];
  }

  @ProtoEnum()
  isolation(): ProtoEnumBuilder {
    return this.builder((e) =>
      e.name("Isolation").values((v) => [
        v.value("ISOLATION_UNSPECIFIED").number(0),
        v.value("ISOLATION_READ_COMMITTED").number(1),
      ])
    );
  }

  @ProtoMessage()
  query(): ProtoMessageBuilder {
    return this.builder("Query").fields((f) => ({
      sql: f.string().number(1),
      isolation: f.enum("Isolation").number(2),
    }));
  }

  @ProtoMessage()
  queryResult(): ProtoMessageBuilder {
    return this.builder("QueryResult").fields((f) => ({ rows: f.bytes().repeated().number(1) }));
  }

  @ProtoService()
  database(): ProtoServiceBuilder {
    return this.builder("Database").rpc((r) => [r.rpc("Execute", "Query", "QueryResult")]);
  }
}

Scribe.test("a @Proto class with no build() still reaches ProtocolBuilder through declaredNodes()", async () => {
  const instance = new DatabaseProtocol();
  const built = await protocol.builder(() => declaredNodes(instance));

  expect(built.enums.map((entry) => entry.name), equals(["Isolation"]));
  expect(built.messages.map((message) => message.name), equals(["Query", "QueryResult"]));
  expect(built.services.map((service) => service.name), equals(["Database"]));
});

Scribe.test("imports() is unaffected by declaredNodes(), still the author's own list", () => {
  const instance = new DatabaseProtocol();
  expect(instance.imports(), equals(["scribe/protocol/common.proto"]));
});
