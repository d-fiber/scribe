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

import type {
  BodyFieldCtor,
  BodySchema,
  FormFieldCtor,
  ScalarCtor,
} from "./field_types.ts";

export interface ArrMarker<C> {
  readonly _arr: true;
  readonly ctor: C;
}

export interface NestedMarker<S extends BodySchema> {
  readonly _nested: true;
  readonly schema: S;
}

export interface RequiredMarker<C> {
  readonly _required: true;
  readonly ctor: C;
}

export function Arr<
  C extends ScalarCtor | BodySchema | typeof File | NestedMarker<BodySchema>,
>(ctor: C): ArrMarker<C> {
  return { _arr: true, ctor };
}

export function Nested<S extends BodySchema>(schema: S): NestedMarker<S> {
  return { _nested: true, schema };
}

export function Required<C extends BodyFieldCtor | FormFieldCtor>(
  ctor: C,
): RequiredMarker<C> {
  return { _required: true, ctor };
}

function hasMarker(value: unknown, marker: string): boolean {
  return typeof value === "object" && value !== null && marker in value;
}

export function isArrMarker(entry: unknown): entry is ArrMarker<unknown> {
  return hasMarker(entry, "_arr");
}

export function isNestedMarker(
  entry: unknown,
): entry is NestedMarker<BodySchema> {
  return hasMarker(entry, "_nested");
}

export function isRequiredEntry<C>(
  entry: C | RequiredMarker<C>,
): entry is RequiredMarker<C> {
  return hasMarker(entry, "_required");
}

export function unwrapFieldCtor<C>(entry: C | RequiredMarker<C>): C {
  return isRequiredEntry(entry) ? entry.ctor : entry;
}
