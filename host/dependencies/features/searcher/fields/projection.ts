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
  FieldSort,
  FieldSortOptions,
  NestedQuery,
  SearcherQuery,
  SortOrder,
} from "../types.ts";
import type { MappingProperty } from "./mapping.ts";

export type TextFields<P extends Record<string, MappingProperty>> = {
  [K in keyof P]: P[K] extends { type: "text" } ? K : never;
}[keyof P];

export type SortableFields<P extends Record<string, MappingProperty>> = {
  [K in keyof P]: P[K] extends { fields: { keyword: unknown } } ? K : never;
}[keyof P];

export type NestedPaths<P extends Record<string, MappingProperty>> = {
  [K in keyof P]: P[K] extends { properties: infer Sub }
    ? Sub extends Record<string, MappingProperty>
      ? { [SK in keyof Sub & string]: `${K & string}.${SK}` }[keyof Sub &
          string]
      : never
    : never;
}[keyof P];

export type NestedFields<P extends Record<string, MappingProperty>> = {
  [K in keyof P]: P[K] extends { type: "nested" } ? K : never;
}[keyof P] &
  string;

export interface QueryFields<P extends Record<string, MappingProperty>> {
  field<F extends keyof P & string>(name: F): F;
  text<F extends TextFields<P> & string>(name: F): F;
  path<F extends NestedPaths<P> & string>(name: F): F;
  boost<F extends TextFields<P> & string>(
    name: F,
    weight: number,
  ): `${F}^${number}`;
  nested(path: NestedFields<P>, query: SearcherQuery): NestedQuery;
  sort<F extends keyof P & string>(
    name: F,
    order: SortOrder,
    extra?: Omit<FieldSortOptions, "order">,
  ): FieldSort;
  keyword<F extends SortableFields<P> & string>(
    name: F,
    order: SortOrder,
  ): FieldSort;
}

export function queryFields<P extends Record<string, MappingProperty>>(
  _properties: P,
): QueryFields<P> {
  return {
    field: (name) => name,
    text: (name) => name,
    path: (name) => name,
    boost: (name, weight) => `${name}^${weight}`,
    nested: (path, query) => ({ nested: { path, query } }),
    sort: (name, order, extra) => ({
      [name]: extra ? { order, ...extra } : order,
    }),
    keyword: (name, order) => ({ [`${name}.keyword`]: order }),
  };
}
