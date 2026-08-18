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
