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

import { assertEquals, assertStringIncludes } from "@std/assert";
import { create } from "@bufbuild/protobuf";
import {
  AccountRequestSchema,
  BanListRequestSchema,
  BanRequestSchema,
  DeviceRequestSchema,
} from "@scribe/sdk/gen/scribe/packages/auth/protocol/auth_pb.ts";
import {
  BroadcastRequestSchema,
  GrantRequestSchema,
} from "@scribe/sdk/gen/scribe/packages/realtime/protocol/realtime_pb.ts";
import { QueueRequestSchema, SearchRequestSchema } from "@scribe/sdk/gen/scribe/packages/search/protocol/search_pb.ts";
import {
  DeleteRequestSchema,
  ListRequestSchema,
  ObjectRefSchema,
} from "@scribe/sdk/gen/scribe/packages/storage/protocol/storage_pb.ts";
import {
  authBan,
  authDeleteAccount,
  authGetAccount,
  authKickAllDevices,
  authKickDevice,
  authListBans,
  authListDevices,
  authListRoles,
  authUnban,
} from "@scribe/auth/lib/src/capability/wire.ts";
import { realtimeBroadcast, realtimeGrant, realtimeRevoke } from "@scribe/realtime/lib/src/capability/wire.ts";
import { searchAdd, searchDelete, searchQuery } from "@scribe/search/lib/src/capability/wire.ts";
import { storageDelete, storageList } from "@scribe/storage/lib/src/capability/wire.ts";

const UNDECLARED = "nothing_declares_this";

Deno.test("every auth procedure refuses a role no declaration answers to, and names it", async () => {
  const account = create(AccountRequestSchema, { accountId: "a", role: UNDECLARED });
  const device = create(DeviceRequestSchema, { accountId: "a", role: UNDECLARED, deviceId: "d" });

  const refusals = [
    (await authGetAccount(account)).error,
    (await authDeleteAccount(account)).error,
    (await authBan(create(BanRequestSchema, { accountId: "a", role: UNDECLARED }))).error,
    (await authUnban(account)).error,
    (await authListBans(create(BanListRequestSchema, { role: UNDECLARED }))).error,
    (await authListDevices(device)).error,
    (await authKickDevice(device)).error,
    (await authKickAllDevices(device)).error,
  ];

  for (const refusal of refusals) {
    assertEquals(refusal?.code, "auth_failed", "a refused auth call carries a failure");
    assertStringIncludes(refusal?.message ?? "", UNDECLARED, "the refusal names the role that was not found");
  }
});

Deno.test("a process that loaded no declaration lists no role rather than refusing", async () => {
  assertEquals((await authListRoles()).roles, []);
});

Deno.test("every realtime procedure refuses a request naming no channel", async () => {
  const refusals = [
    (await realtimeBroadcast(create(BroadcastRequestSchema, { action: "created", entityId: "1" }))).error,
    (await realtimeGrant(create(GrantRequestSchema, { accountIds: ["a"] }))).error,
    (await realtimeRevoke(create(GrantRequestSchema, { accountIds: ["a"] }))).error,
  ];

  for (const refusal of refusals) {
    assertEquals(refusal?.code, "realtime_failed", "a refused realtime call carries a failure");
    assertStringIncludes(refusal?.message ?? "", "missing channel", "the refusal says what was missing");
  }
});

Deno.test("every search procedure refuses an index this process never declared, and names it", async () => {
  const queue = create(QueueRequestSchema, { index: UNDECLARED, ids: ["1"] });

  const refusals = [
    (await searchAdd(queue)).error,
    (await searchDelete(queue)).error,
    (await searchQuery(create(SearchRequestSchema, { index: UNDECLARED }))).error,
  ];

  for (const refusal of refusals) {
    assertEquals(refusal?.code, "search_failed", "a refused search call carries a failure");
    assertStringIncludes(refusal?.message ?? "", UNDECLARED, "the refusal names the index that was not found");
  }
});

Deno.test("a delete naming no object removes nothing and refuses nothing", async () => {
  const answer = await storageDelete(create(DeleteRequestSchema, { objects: [] }));

  assertEquals(answer.error, undefined);
  assertEquals(answer.deleted, 0);
});

Deno.test("a delete naming an object with no folder is refused before any bucket is reached", async () => {
  const answer = await storageDelete(
    create(DeleteRequestSchema, { objects: [create(ObjectRefSchema, { filename: "a.png" })] }),
  );

  assertEquals(answer.error?.code, "invalid_object");
});

Deno.test("a delete whose folder no project declared is refused under its own code", async () => {
  const answer = await storageDelete(
    create(DeleteRequestSchema, {
      objects: [create(ObjectRefSchema, { folder: UNDECLARED, filename: "a.png" })],
    }),
  );

  assertEquals(answer.error?.code, "unknown_folder");
  assertStringIncludes(answer.error?.message ?? "", UNDECLARED);
});

Deno.test("a listing naming no folder is refused, and one naming an undeclared folder says so", async () => {
  assertEquals((await storageList(create(ListRequestSchema, {}))).error?.code, "invalid_object");
  assertEquals((await storageList(create(ListRequestSchema, { folder: UNDECLARED }))).error?.code, "unknown_folder");
});
