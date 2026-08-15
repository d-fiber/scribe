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
  BodyFieldEntry,
  BodySchema,
  FormFieldEntry,
  FormSchema,
  ScalarCtor,
} from "./field_types.ts";
import type { ArrMarker, NestedMarker, RequiredMarker } from "./markers.ts";

type IsRequired<E> = E extends RequiredMarker<unknown> ? true : false;
type UnwrapEntry<E> = E extends RequiredMarker<infer C> ? C : E;

type ArrItem<C> = C extends StringConstructor ? string
  : C extends NumberConstructor ? number
  : C extends BooleanConstructor ? boolean
  : C extends ObjectConstructor ? Record<string, unknown>
  : C extends typeof File ? File
  : C extends NestedMarker<infer S extends BodySchema> ? BodyFromSchema<S>
  : C extends BodySchema ? BodyFromSchema<C>
  : never;

type Resolve<C, Null extends boolean> = C extends StringConstructor ? string
  : C extends NumberConstructor ? Null extends true ? number | null
    : number
  : C extends BooleanConstructor ? Null extends true ? boolean | null
    : boolean
  : C extends ObjectConstructor ? Null extends true ? Record<string, unknown> | null
    : Record<string, unknown>
  : C extends typeof File ? Null extends true ? File | null
    : File
  : C extends ArrMarker<NestedMarker<infer S extends BodySchema>> ? Null extends true ? BodyFromSchema<S>[] | null
    : BodyFromSchema<S>[]
  : C extends ArrMarker<infer E extends ScalarCtor | typeof File> ? Null extends true ? ArrItem<E>[] | null
    : ArrItem<E>[]
  : C extends NestedMarker<infer S extends BodySchema> ? Null extends true ? BodyFromSchema<S> | null
    : BodyFromSchema<S>
  : never;

type FieldResult<E> = Resolve<
  UnwrapEntry<E>,
  IsRequired<E> extends true ? false : true
>;

export type BodyFieldResult<E extends BodyFieldEntry> = FieldResult<E>;
export type FormFieldResult<E extends FormFieldEntry> = FieldResult<E>;

export type BodyFromSchema<S extends BodySchema> = {
  [K in keyof S]: BodyFieldResult<S[K]>;
};

export type FormFromSchema<S extends FormSchema> = {
  [K in keyof S]: FormFieldResult<S[K]>;
};
