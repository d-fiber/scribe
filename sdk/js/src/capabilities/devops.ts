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

import {
  type DynamicLink,
  DynamicLinks,
  RemoteConfigs,
} from "../../gen/scribe/host/dependencies/features/devops/protocol/devops_pb.ts";
import { decodeJson, encodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

export interface DynamicLinkInput {
  readonly id?: string;
  readonly slug: string;
  readonly targetUrl: string;
  readonly metadata?: unknown;
  readonly expiresAt?: number;
}

export interface DynamicLinkRecord {
  readonly id: string;
  readonly slug: string;
  readonly targetUrl: string;
  readonly metadata: unknown;
  readonly expiresAt: number;
}

function linkOf(link: DynamicLink | undefined): DynamicLinkRecord | null {
  if (!link) return null;
  return {
    id: link.id,
    slug: link.slug,
    targetUrl: link.targetUrl,
    metadata: decodeJson(link.metadata),
    expiresAt: Number(link.expiresAt),
  };
}

function payloadOf(input: DynamicLinkInput) {
  return {
    id: input.id ?? "",
    slug: input.slug,
    targetUrl: input.targetUrl,
    metadata: encodeJson(input.metadata ?? {}),
    expiresAt: BigInt(input.expiresAt ?? 0),
  };
}

export const dynamicLinks = {
  async add(input: DynamicLinkInput): Promise<DynamicLinkRecord | null> {
    const result = await host.client().call(DynamicLinks.method.add, { link: payloadOf(input) });
    raiseOn("dynamic-links", result.error);
    return linkOf(result.link);
  },

  async update(input: DynamicLinkInput): Promise<DynamicLinkRecord | null> {
    const result = await host.client().call(DynamicLinks.method.update, { link: payloadOf(input) });
    raiseOn("dynamic-links", result.error);
    return linkOf(result.link);
  },

  async remove(reference: { id?: string; slug?: string }): Promise<void> {
    const result = await host.client().call(DynamicLinks.method.remove, {
      id: reference.id ?? "",
      slug: reference.slug ?? "",
    });
    raiseOn("dynamic-links", result.error);
  },
};

export const remoteConfigs = {
  async get<T>(key: string, platform = "", appVersion = ""): Promise<T | null> {
    const result = await host.client().call(RemoteConfigs.method.get, {
      key,
      platform,
      appVersion,
    });
    raiseOn("remote-configs", result.error);
    return decodeJson<T>(result.value);
  },
};
