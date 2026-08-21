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
