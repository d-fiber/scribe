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

import { create } from "@bufbuild/protobuf";
import { TimeSchema } from "../../gen/scribe/protocol/common_pb.ts";
import {
  ObjectRefSchema,
  Storage,
} from "../../gen/scribe/host/packages/storage/protocol/storage_pb.ts";
import type { Time } from "../contracts/time.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "storage";

export interface ObjectLocation {
  readonly folder: string;
  readonly pathArgs?: Readonly<Record<string, string>>;
  readonly filename: string;
}

export interface StoredObject {
  readonly path: string;
  readonly bytes: number;
  readonly mimeType: string;
  readonly updatedAt: number;
}

function refOf(location: ObjectLocation) {
  return create(ObjectRefSchema, {
    folder: location.folder,
    pathArgs: { ...(location.pathArgs ?? {}) },
    filename: location.filename,
  });
}

export const storage = {
  async upload(
    location: ObjectLocation,
    content: Uint8Array,
    mimeType: string,
    upsert = false,
  ): Promise<string> {
    const result = await host.client().call(Storage.method.upload, {
      object: refOf(location),
      content,
      mimeType,
      upsert,
    });
    raiseOn(CAPABILITY, result.error);
    return result.path;
  },

  async delete(locations: readonly ObjectLocation[]): Promise<number> {
    const result = await host.client().call(Storage.method.delete, {
      objects: locations.map(refOf),
    });
    raiseOn(CAPABILITY, result.error);
    return result.deleted;
  },

  async signedUrl(location: ObjectLocation, expiresIn: Time): Promise<string> {
    const result = await host.client().call(Storage.method.signedUrl, {
      object: refOf(location),
      expiresIn: create(TimeSchema, { millis: BigInt(expiresIn.ms) }),
    });
    raiseOn(CAPABILITY, result.error);
    return result.url;
  },

  async list(
    folder: string,
    pathArgs: Readonly<Record<string, string>> = {},
    limit = 100,
    offset = 0,
  ): Promise<readonly StoredObject[]> {
    const result = await host.client().call(Storage.method.list, {
      folder,
      pathArgs: { ...pathArgs },
      limit,
      offset,
    });
    raiseOn(CAPABILITY, result.error);
    return result.objects.map((object) => ({
      path: object.path,
      bytes: Number(object.size?.bytes ?? 0n),
      mimeType: object.mimeType,
      updatedAt: Number(object.updatedAt),
    }));
  },
};
