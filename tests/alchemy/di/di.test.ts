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

import "@scribe/runtime/scholium/runner.ts";
import { contains, equals, expect, having, isA, same, Scribe, throwsA } from "@scribe/alchemy/test";
import {
  BindingError,
  Container,
  container as sharedContainer,
  DuplicateDeclarationError,
  Singleton,
} from "@scribe/alchemy";

class GroundSdk {
  readonly label = "sdk";
}

abstract class AdminService {
  abstract whoAmI(): string;
}

Scribe.test("a container hands back the same instance every time it is resolved", () => {
  const container = new Container();
  container.registerSingleton(GroundSdk, () => new GroundSdk());

  const first = container.resolve(GroundSdk);
  const second = container.resolve(GroundSdk);

  expect(first, same(second), "resolving twice built two instances instead of one");
});

Scribe.test("a factory is not called before the first resolve", () => {
  const container = new Container();
  let built = 0;
  container.registerSingleton(GroundSdk, () => {
    built++;
    return new GroundSdk();
  });

  expect(built, equals(0), "registering already built the singleton");
  container.resolve(GroundSdk);
  expect(built, equals(1), "resolving did not build the singleton");
  container.resolve(GroundSdk);
  expect(built, equals(1), "a second resolve built the singleton again");
});

Scribe.test("resolving a token nobody registered is refused, and the refusal names it", () => {
  const container = new Container();

  expect(
    () => container.resolve(GroundSdk),
    throwsA(having(
      isA(BindingError),
      (raised) => raised.message,
      "message",
      contains('"GroundSdk" was never registered'),
    )),
  );
});

Scribe.test("a token registered twice is refused where it is written", () => {
  const container = new Container();
  container.registerSingleton(GroundSdk, () => new GroundSdk());

  expect(
    () => container.registerSingleton(GroundSdk, () => new GroundSdk()),
    throwsA(having(
      isA(DuplicateDeclarationError),
      (raised) => raised.message,
      "message",
      contains('"GroundSdk" is registered twice'),
    )),
  );
});

Scribe.test("forgetting a token lets it be registered and built again", () => {
  const container = new Container();
  container.registerSingleton(GroundSdk, () => new GroundSdk());
  const first = container.resolve(GroundSdk);

  container.forget(GroundSdk);
  container.registerSingleton(GroundSdk, () => new GroundSdk());
  const second = container.resolve(GroundSdk);

  expect(first, isA(GroundSdk), "the first build was not the class under test");
  expect(second, isA(GroundSdk), "the second build was not the class under test");
});

Scribe.test("a synchronous resolve refuses a token built by an asynchronous factory", () => {
  const container = new Container();
  container.registerSingleton(GroundSdk, () => Promise.resolve(new GroundSdk()));

  expect(
    () => container.resolve(GroundSdk),
    throwsA(having(
      isA(BindingError),
      (raised) => raised.message,
      "message",
      contains("container.resolveAsync(GroundSdk)"),
    )),
  );
});

Scribe.test("resolveAsync waits out an asynchronous factory and builds only once", async () => {
  const container = new Container();
  let built = 0;
  container.registerSingleton(GroundSdk, async () => {
    built++;
    await Promise.resolve();
    return new GroundSdk();
  });

  const first = await container.resolveAsync(GroundSdk);
  const second = await container.resolveAsync(GroundSdk);

  expect(first, same(second), "resolveAsync built two instances instead of one");
  expect(built, equals(1), "the asynchronous factory ran more than once");
});

Scribe.test("a class marked @Singleton resolves the tokens its constructor asks for", () => {
  sharedContainer.registerSingleton(GroundSdk, () => new GroundSdk());
  try {
    @Singleton([GroundSdk])
    class AdminServiceImpl extends AdminService {
      constructor(private readonly groundSdk: GroundSdk) {
        super();
      }

      override whoAmI(): string {
        return this.groundSdk.label;
      }
    }

    const admin = sharedContainer.resolve(AdminServiceImpl);

    expect(admin.whoAmI(), equals("sdk"), "the constructor did not receive the registered dependency");
  } finally {
    sharedContainer.forget(GroundSdk);
  }
});

Scribe.test("a class marked @Singleton can register under an abstract token", () => {
  sharedContainer.registerSingleton(GroundSdk, () => new GroundSdk());
  try {
    @Singleton([GroundSdk], { as: AdminService })
    class AdminServiceImpl extends AdminService {
      constructor(private readonly groundSdk: GroundSdk) {
        super();
      }

      override whoAmI(): string {
        return this.groundSdk.label;
      }
    }

    expect(
      sharedContainer.has(AdminServiceImpl),
      equals(false),
      "the implementation was registered under its own class",
    );
    expect(
      sharedContainer.resolve(AdminService).whoAmI(),
      equals("sdk"),
      "resolving the abstract token missed the binding",
    );
  } finally {
    sharedContainer.forget(GroundSdk);
    sharedContainer.forget(AdminService);
  }
});

Scribe.test("two concurrent asynchronous resolves of the same token share one build", async () => {
  const container = new Container();
  let built = 0;
  container.registerSingleton(GroundSdk, async () => {
    built++;
    await Promise.resolve();
    return new GroundSdk();
  });

  const [first, second] = await Promise.all([container.resolveAsync(GroundSdk), container.resolveAsync(GroundSdk)]);

  expect(first, same(second), "two concurrent resolves built two instances instead of sharing one");
  expect(built, equals(1), "two concurrent resolves ran the factory more than once");
});
