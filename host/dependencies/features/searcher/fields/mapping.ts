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
  MappingBooleanProperty,
  MappingDateProperty,
  MappingGeoPointProperty,
  MappingKeywordProperty,
  MappingNestedProperty,
  MappingNumberProperty,
  MappingObjectProperty,
  MappingProperty,
  MappingTextProperty,
} from "@opensearch-project/opensearch/api/types";

export type { MappingProperty };

type Overrides<T> = Omit<T, "type">;

function keyword(
  overrides?: Overrides<MappingKeywordProperty>,
): MappingKeywordProperty {
  return { type: "keyword", ...overrides };
}

function text(
  options: { sortable: true } & Overrides<MappingTextProperty>,
): MappingTextProperty & { fields: { keyword: MappingKeywordProperty } };
function text(
  options?: { sortable?: false } & Overrides<MappingTextProperty>,
): MappingTextProperty;
function text(
  options?: { sortable?: boolean } & Overrides<MappingTextProperty>,
): MappingTextProperty {
  const { sortable, ...overrides } = options ?? {};
  return {
    type: "text",
    ...(sortable
      ? {
        fields: {
          keyword: { type: "keyword", normalizer: "sort_normalizer" },
        },
      }
      : {}),
    ...overrides,
  };
}

function timestamp(
  overrides?: Overrides<MappingNumberProperty>,
): MappingNumberProperty {
  return { type: "long", ...overrides };
}

function date(overrides?: Overrides<MappingDateProperty>): MappingDateProperty {
  return { type: "date", ...overrides };
}

function geo(
  overrides?: Overrides<MappingGeoPointProperty>,
): MappingGeoPointProperty {
  return { type: "geo_point", ...overrides };
}

function bool(
  overrides?: Overrides<MappingBooleanProperty>,
): MappingBooleanProperty {
  return { type: "boolean", ...overrides };
}

function integer(
  overrides?: Overrides<MappingNumberProperty>,
): MappingNumberProperty {
  return { type: "integer", ...overrides };
}

function short(
  overrides?: Overrides<MappingNumberProperty>,
): MappingNumberProperty {
  return { type: "short", ...overrides };
}

function float(
  overrides?: Overrides<MappingNumberProperty>,
): MappingNumberProperty {
  return { type: "float", ...overrides };
}

function double(
  overrides?: Overrides<MappingNumberProperty>,
): MappingNumberProperty {
  return { type: "double", ...overrides };
}

function object<P extends Record<string, MappingProperty>>(
  properties: P,
  options:
    & { nested: true }
    & Omit<
      MappingNestedProperty,
      "type" | "properties"
    >,
): Omit<MappingNestedProperty, "properties"> & { properties: P };
function object<P extends Record<string, MappingProperty>>(
  properties: P,
  options?:
    & { nested?: false }
    & Omit<
      MappingObjectProperty,
      "type" | "properties"
    >,
): Omit<MappingObjectProperty, "properties"> & { properties: P };
function object<P extends Record<string, MappingProperty>>(
  properties: P,
  options?:
    & { nested?: boolean }
    & Omit<
      MappingObjectProperty | MappingNestedProperty,
      "type" | "properties"
    >,
): (MappingObjectProperty | MappingNestedProperty) & { properties: P } {
  const { nested, ...overrides } = options ?? {};
  return nested ? { type: "nested", properties, ...overrides } : { type: "object", properties, ...overrides };
}

export const Field = {
  keyword,
  text,
  timestamp,
  date,
  geo,
  bool,
  integer,
  short,
  float,
  double,
  object,
};
