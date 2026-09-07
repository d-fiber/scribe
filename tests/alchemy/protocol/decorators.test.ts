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
import { allOf, equals, expect, hasLength, isA, Scribe, throwsA, withMessage } from "@scribe/alchemy/test";
import type { Future, List, ProtocolBuilder, ProtocolSource } from "@scribe/alchemy";
import {
  ClientProtocol,
  CoreProtocol,
  declaredProtocols,
  DuplicateDeclarationError,
  forgetProtocols,
  protocol,
  RuntimeProtocol,
} from "@scribe/alchemy";

abstract class StubSource implements ProtocolSource {
  imports(): List<string> {
    return [];
  }

  build(): Future<ProtocolBuilder> {
    return protocol.builder(() => []);
  }
}

Scribe.test("@CoreProtocol() registers the class under its own name, with the v1 family", () => {
  forgetProtocols();

  @CoreProtocol()
  class DecoratorsCoreOne extends StubSource {}
  void DecoratorsCoreOne;

  const entry = declaredProtocols().find((registered) => registered.name === "DecoratorsCoreOne");
  expect(entry?.family, equals("v1"), "the class was not filed under the socle family");
  expect(entry?.source, equals(DecoratorsCoreOne), "the registry lost the class itself");
});

Scribe.test("@RuntimeProtocol() registers the class under the runtime family", () => {
  forgetProtocols();

  @RuntimeProtocol()
  class DecoratorsRuntimeOne extends StubSource {}
  void DecoratorsRuntimeOne;

  const entry = declaredProtocols().find((registered) => registered.name === "DecoratorsRuntimeOne");
  expect(entry?.family, equals("runtime"), "the class was not filed under the runtime family");
});

Scribe.test("@ClientProtocol() registers the class under the clients family", () => {
  forgetProtocols();

  @ClientProtocol()
  class DecoratorsClientOne extends StubSource {}
  void DecoratorsClientOne;

  const entry = declaredProtocols().find((registered) => registered.name === "DecoratorsClientOne");
  expect(entry?.family, equals("clients"), "the class was not filed under the clients family");
});

Scribe.test("declaredProtocols() answers everything declared, in declaration order", () => {
  forgetProtocols();

  @CoreProtocol()
  class DecoratorsOrderFirst extends StubSource {}
  void DecoratorsOrderFirst;

  @RuntimeProtocol()
  class DecoratorsOrderSecond extends StubSource {}
  void DecoratorsOrderSecond;

  expect(
    declaredProtocols().map((registered) => registered.name),
    equals(["DecoratorsOrderFirst", "DecoratorsOrderSecond"]),
    "the classes did not come back in declaration order",
  );
});

Scribe.test("a name declared twice under the same family is refused", () => {
  forgetProtocols();

  @CoreProtocol()
  class DecoratorsDuplicateSame extends StubSource {}
  void DecoratorsDuplicateSame;

  expect(
    () => {
      @CoreProtocol()
      class DecoratorsDuplicateSame extends StubSource {}
      void DecoratorsDuplicateSame;
    },
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('protocol "DecoratorsDuplicateSame" is declared twice'))),
  );
});

Scribe.test("a name declared under one family collides with the same name under another family", () => {
  forgetProtocols();

  @CoreProtocol()
  class DecoratorsDuplicateAcrossFamilies extends StubSource {}
  void DecoratorsDuplicateAcrossFamilies;

  expect(
    () => {
      @RuntimeProtocol()
      class DecoratorsDuplicateAcrossFamilies extends StubSource {}
      void DecoratorsDuplicateAcrossFamilies;
    },
    throwsA(allOf(
      isA(DuplicateDeclarationError),
      withMessage('protocol "DecoratorsDuplicateAcrossFamilies" is declared twice'),
    )),
  );
});

Scribe.test("forgetProtocols() empties the registry", () => {
  forgetProtocols();

  @CoreProtocol()
  class DecoratorsForgotten extends StubSource {}
  void DecoratorsForgotten;

  expect(declaredProtocols(), hasLength(1), "the class was not registered before forgetting");
  forgetProtocols();
  expect(declaredProtocols(), hasLength(0), "forgetting left a declaration behind");

  @CoreProtocol()
  class DecoratorsForgottenAgain extends StubSource {}
  void DecoratorsForgottenAgain;

  expect(
    declaredProtocols().map((registered) => registered.name),
    equals(["DecoratorsForgottenAgain"]),
    "a name freed by forgetting is still refused",
  );
});
