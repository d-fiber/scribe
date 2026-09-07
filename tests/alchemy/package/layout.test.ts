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
import { equals, expect, isFalse, isTrue, Scribe } from "@scribe/alchemy/test";
import { isPackageDirectory, MANIFEST, MANIFEST_KEYS, PACKAGE_LAYOUT, requiredEntries } from "@scribe/alchemy";

Scribe.test("the manifest is named package.yaml", () => {
  expect(MANIFEST, equals("package.yaml"));
});

Scribe.test("the manifest holds exactly five keys, name through dependencies", () => {
  expect(MANIFEST_KEYS, equals(["name", "description", "version", "environment", "dependencies"]));
});

Scribe.test("lib and deploy are the two directories a package cannot be without", () => {
  const required = PACKAGE_LAYOUT.filter((directory) => directory.required).map((directory) => directory.name);
  expect(required, equals(["lib", "deploy"]));
});

Scribe.test("protocol, tests and examples are directories a package may leave out", () => {
  const optional = PACKAGE_LAYOUT.filter((directory) => !directory.required).map((directory) => directory.name);
  expect(optional, equals(["protocol", "tests", "examples"]));
});

Scribe.test("isPackageDirectory knows every directory the layout names", () => {
  for (const directory of PACKAGE_LAYOUT) {
    expect(isPackageDirectory(directory.name), isTrue, `${directory.name} is part of the layout`);
  }
});

Scribe.test("isPackageDirectory refuses a name the layout does not carry", () => {
  expect(isPackageDirectory("bin"), isFalse, "a name outside the layout was accepted");
  expect(isPackageDirectory(""), isFalse, "an empty name was accepted");
});

Scribe.test("requiredEntries names the manifest, lib and deploy, and nothing else", () => {
  expect(requiredEntries(), equals(["package.yaml", "lib", "deploy"]));
});
