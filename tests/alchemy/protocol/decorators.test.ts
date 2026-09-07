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
import type { List } from "@scribe/alchemy";
import { declaredProtocols, DuplicateDeclarationError, forgetProtocols, Proto, ProtoBuilder } from "@scribe/alchemy";

abstract class StubSource extends ProtoBuilder {
  imports(): List<string> {
    return [];
  }
}

Scribe.test("@Proto() registers the class under its own name, with no module", () => {
  forgetProtocols();

  @Proto()
  class DecoratorsCoreOne extends StubSource {}
  void DecoratorsCoreOne;

  const entry = declaredProtocols().find((registered) => registered.name === "DecoratorsCoreOne");
  expect(entry?.module, equals(undefined), "a bare @Proto() should carry no module");
  expect(entry?.source, equals(DecoratorsCoreOne), "the registry lost the class itself");
});

Scribe.test("@Proto(module) carries the module it was given", () => {
  forgetProtocols();

  @Proto("database")
  class DecoratorsModuleOne extends StubSource {}
  void DecoratorsModuleOne;

  const entry = declaredProtocols().find((registered) => registered.name === "DecoratorsModuleOne");
  expect(entry?.module, equals("database"));
});

Scribe.test("declaredProtocols() answers everything declared, in declaration order", () => {
  forgetProtocols();

  @Proto()
  class DecoratorsOrderFirst extends StubSource {}
  void DecoratorsOrderFirst;

  @Proto("database")
  class DecoratorsOrderSecond extends StubSource {}
  void DecoratorsOrderSecond;

  expect(
    declaredProtocols().map((registered) => registered.name),
    equals(["DecoratorsOrderFirst", "DecoratorsOrderSecond"]),
    "the classes did not come back in declaration order",
  );
});

Scribe.test("a name declared twice is refused", () => {
  forgetProtocols();

  @Proto()
  class DecoratorsDuplicateSame extends StubSource {}
  void DecoratorsDuplicateSame;

  expect(
    () => {
      @Proto("database")
      class DecoratorsDuplicateSame extends StubSource {}
      void DecoratorsDuplicateSame;
    },
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('protocol "DecoratorsDuplicateSame" is declared twice'))),
  );
});

Scribe.test("forgetProtocols() empties the registry", () => {
  forgetProtocols();

  @Proto()
  class DecoratorsForgotten extends StubSource {}
  void DecoratorsForgotten;

  expect(declaredProtocols(), hasLength(1), "the class was not registered before forgetting");
  forgetProtocols();
  expect(declaredProtocols(), hasLength(0), "forgetting left a declaration behind");

  @Proto()
  class DecoratorsForgottenAgain extends StubSource {}
  void DecoratorsForgottenAgain;

  expect(
    declaredProtocols().map((registered) => registered.name),
    equals(["DecoratorsForgottenAgain"]),
    "a name freed by forgetting is still refused",
  );
});
