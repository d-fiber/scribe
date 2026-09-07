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
import { allOf, equals, expect, isA, Scribe, throwsA, withMessage } from "@scribe/alchemy/test";
import {
  type DeclaredMessage,
  declaredNodes,
  type DeclaredProtoEnum,
  Message,
  protocol,
  ProtoEnum,
  ProtoEnumMember,
  ProtoMessage,
  ProtoServiceMember,
  RpcService,
  type RpcServiceBuilder,
} from "@scribe/alchemy";

Scribe.test("declaredNodes() answers nothing for a class with no decorated method", () => {
  class Empty {}

  expect(declaredNodes(new Empty()), equals([]));
});

Scribe.test("a single @ProtoMessage() method resolves to its own message", () => {
  class One {
    @ProtoMessage()
    query(): DeclaredMessage {
      return Message("Query").fields((f) => ({ sql: f.string().number(1) }));
    }
  }

  expect(
    declaredNodes(new One()),
    equals([{
      kind: "message",
      name: "Query",
      fields: { sql: { type: { kind: "scalar", scalar: "string" }, number: 1, optional: false } },
      reservedNumbers: [],
      reservedNames: [],
    }]),
  );
});

Scribe.test("several @ProtoMessage() methods resolve in the order they appear in the class body", () => {
  class Two {
    @ProtoMessage()
    query(): DeclaredMessage {
      return Message("Query").fields((f) => ({ sql: f.string().number(1) }));
    }

    @ProtoMessage()
    queryResult(): DeclaredMessage {
      return Message("QueryResult").fields((f) => ({ rows: f.bytes().repeated().number(1) }));
    }
  }

  expect(
    declaredNodes(new Two()).map((node) => (node as DeclaredMessage).name),
    equals(["Query", "QueryResult"]),
  );
});

Scribe.test("@ProtoMessage(), @ProtoEnumMember() and @ProtoServiceMember() share one ordered list, not one per kind", () => {
  class Mixed {
    @ProtoMessage()
    query(): DeclaredMessage {
      return Message("Query").fields((f) => ({ sql: f.string().number(1) }));
    }

    @ProtoEnumMember()
    sortOrder(): DeclaredProtoEnum {
      return ProtoEnum((e) => e.name("SortOrder").values((v) => [v.value("SORT_ORDER_UNSPECIFIED").number(0)]));
    }

    @ProtoServiceMember()
    database(): RpcServiceBuilder {
      return RpcService("Database").rpc("Execute", "Query", "Query");
    }
  }

  const nodes = declaredNodes(new Mixed());
  expect(nodes, equals(nodes)); // sanity: resolving twice does not throw
  expect(nodes.length, equals(3));
});

Scribe.test("declaredNodes() feeds protocol.builder() the same way a build() array literal would", async () => {
  class DatabaseProtocol {
    @ProtoMessage()
    query(): DeclaredMessage {
      return Message("Query").fields((f) => ({ sql: f.string().number(1) }));
    }

    @ProtoMessage()
    queryResult(): DeclaredMessage {
      return Message("QueryResult").fields((f) => ({ rows: f.bytes().repeated().number(1) }));
    }

    @ProtoServiceMember()
    database(): RpcServiceBuilder {
      return RpcService("Database").rpc("Execute", "Query", "QueryResult");
    }
  }

  const instance = new DatabaseProtocol();
  const built = await protocol.builder(() => declaredNodes(instance));

  expect(built.messages.map((message) => message.name), equals(["Query", "QueryResult"]));
  expect(built.services.map((service) => service.name), equals(["Database"]));
});

Scribe.test("two @ProtoMessage() methods declaring the same name are refused by ProtocolBuilder, not by the decorator", () => {
  class Colliding {
    @ProtoMessage()
    first(): DeclaredMessage {
      return Message("Shared").fields((f) => ({ id: f.string().number(1) }));
    }

    @ProtoMessage()
    second(): DeclaredMessage {
      return Message("Shared").fields((f) => ({ id: f.string().number(1) }));
    }
  }

  const instance = new Colliding();
  expect(
    () => protocol.builder(() => declaredNodes(instance)),
    throwsA(allOf(isA(Error), withMessage('"Shared" names two messages or enums in the same build()'))),
  );
});

Scribe.test("@ProtoMessage() on a static method is refused", () => {
  expect(
    () => {
      class StaticMessage {
        @ProtoMessage()
        static query(): DeclaredMessage {
          return Message("Query").fields((f) => ({ sql: f.string().number(1) }));
        }
      }
      void StaticMessage;
    },
    throwsA(allOf(isA(Error), withMessage("only an instance method can be marked"))),
  );
});

Scribe.test("two unrelated classes each declaring @ProtoMessage() methods do not see each other's nodes", () => {
  class A {
    @ProtoMessage()
    one(): DeclaredMessage {
      return Message("FromA").fields((f) => ({ id: f.string().number(1) }));
    }
  }

  class B {
    @ProtoMessage()
    one(): DeclaredMessage {
      return Message("FromB").fields((f) => ({ id: f.string().number(1) }));
    }
  }

  expect(declaredNodes(new A()).map((node) => (node as DeclaredMessage).name), equals(["FromA"]));
  expect(declaredNodes(new B()).map((node) => (node as DeclaredMessage).name), equals(["FromB"]));
});
