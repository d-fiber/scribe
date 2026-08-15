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

export interface EntitySearchParams {
  page?: { from?: number; size?: number };
}

export interface EntityQueryPlan {
  readonly bool: BoolQuery["bool"];
  readonly sort: SearcherSort[];
}

import type { MappingFieldType } from "@opensearch-project/opensearch/api/types";

export type { MappingFieldType };

export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

export enum Operator {
  And = "AND",
  Or = "OR",
}

export enum SortMode {
  Min = "min",
  Max = "max",
  Sum = "sum",
  Avg = "avg",
  Median = "median",
}

export enum NestedScoreMode {
  Avg = "avg",
  Sum = "sum",
  Min = "min",
  Max = "max",
  None = "none",
}

export enum MultiMatchType {
  BestFields = "best_fields",
  MostFields = "most_fields",
  CrossFields = "cross_fields",
  Phrase = "phrase",
  PhrasePrefix = "phrase_prefix",
  BoolPrefix = "bool_prefix",
}

export enum DistanceUnit {
  Kilometers = "km",
  Meters = "m",
  Miles = "mi",
  Yards = "yd",
  Feet = "ft",
  Inches = "in",
  NauticalMiles = "nmi",
  Centimeters = "cm",
  Millimeters = "mm",
}

export enum ScriptValueType {
  Number = "number",
  String = "string",
}

export enum ScriptLang {
  Painless = "painless",
}

export type ScalarValue = string | number | boolean;

export type Fuzziness = "AUTO" | `AUTO:${number},${number}` | 0 | 1 | 2;

export const Fuzziness = {
  auto: (): "AUTO" => "AUTO",
  autoRange: (low: number, high: number): `AUTO:${number},${number}` => `AUTO:${low},${high}`,
  exact: (editDistance: 0 | 1 | 2): 0 | 1 | 2 => editDistance,
};

export type MinimumShouldMatch = number | string;

export type DateMathUnit = "y" | "M" | "w" | "d" | "h" | "H" | "m" | "s";

export class DateMath {
  private constructor(private readonly expression: string) {}

  static now(): DateMath {
    return new DateMath("now");
  }

  static of(date: string): DateMath {
    return new DateMath(`${date}||`);
  }

  plus(amount: number, unit: DateMathUnit): DateMath {
    return new DateMath(`${this.expression}+${amount}${unit}`);
  }

  minus(amount: number, unit: DateMathUnit): DateMath {
    return new DateMath(`${this.expression}-${amount}${unit}`);
  }

  roundTo(unit: DateMathUnit): DateMath {
    return new DateMath(`${this.expression}/${unit}`);
  }

  toJSON(): string {
    return this.expression;
  }

  toString(): string {
    return this.expression;
  }
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

export const GeoPoint = {
  of: (lat: number, lon: number): GeoPoint => ({ lat, lon }),
};

export type GeoLocation = string | [number, number] | GeoPoint;

export type DistanceValue = `${number}${DistanceUnit}`;

export const Distance = {
  kilometers: (value: number): `${number}${DistanceUnit.Kilometers}` => `${value}${DistanceUnit.Kilometers}`,
  meters: (value: number): `${number}${DistanceUnit.Meters}` => `${value}${DistanceUnit.Meters}`,
  miles: (value: number): `${number}${DistanceUnit.Miles}` => `${value}${DistanceUnit.Miles}`,
  yards: (value: number): `${number}${DistanceUnit.Yards}` => `${value}${DistanceUnit.Yards}`,
  feet: (value: number): `${number}${DistanceUnit.Feet}` => `${value}${DistanceUnit.Feet}`,
  inches: (value: number): `${number}${DistanceUnit.Inches}` => `${value}${DistanceUnit.Inches}`,
  nauticalMiles: (value: number): `${number}${DistanceUnit.NauticalMiles}` => `${value}${DistanceUnit.NauticalMiles}`,
  centimeters: (value: number): `${number}${DistanceUnit.Centimeters}` => `${value}${DistanceUnit.Centimeters}`,
  millimeters: (value: number): `${number}${DistanceUnit.Millimeters}` => `${value}${DistanceUnit.Millimeters}`,
};

export interface MatchAllQuery {
  match_all: Record<string, never>;
}

export interface TermQuery {
  term: Record<string, ScalarValue>;
}

export interface TermsQuery {
  terms: Record<string, ScalarValue[]>;
}

export interface RangeQuery {
  range: Record<
    string,
    {
      gte?: number | string | DateMath;
      lte?: number | string | DateMath;
      gt?: number | string | DateMath;
      lt?: number | string | DateMath;
    }
  >;
}

export interface MultiMatchQuery {
  multi_match: {
    query: string;
    fields: string[];
    type?: MultiMatchType;
    fuzziness?: Fuzziness;
    prefix_length?: number;
    operator?: Operator;
    minimum_should_match?: MinimumShouldMatch;
    boost?: number;
  };
}

export interface MatchQuery {
  match: Record<
    string,
    string | { query: string; operator?: Operator; fuzziness?: Fuzziness }
  >;
}

export interface GeoDistanceQuery {
  geo_distance: {
    distance: DistanceValue;
    [field: string]: GeoLocation | DistanceValue;
  };
}

export interface BoolQuery {
  bool: {
    must?: SearcherQuery | SearcherQuery[];
    filter?: SearcherQuery | SearcherQuery[];
    must_not?: SearcherQuery | SearcherQuery[];
    should?: SearcherQuery | SearcherQuery[];
    minimum_should_match?: MinimumShouldMatch;
    boost?: number;
  };
}

export interface NestedQuery {
  nested: {
    path: string;
    query: SearcherQuery;
    score_mode?: NestedScoreMode;
    ignore_unmapped?: boolean;
  };
}

export type SearcherQuery =
  | MatchAllQuery
  | TermQuery
  | TermsQuery
  | RangeQuery
  | MultiMatchQuery
  | MatchQuery
  | GeoDistanceQuery
  | BoolQuery
  | NestedQuery;

export interface FieldSortOptions {
  order: SortOrder;
  unmapped_type?: MappingFieldType;
  missing?: "_first" | "_last" | string | number;
  mode?: SortMode;
}

export interface FieldSort {
  [field: string]: SortOrder | FieldSortOptions;
}

export interface GeoDistanceSort {
  _geo_distance: {
    [field: string]:
      | GeoLocation
      | SortOrder
      | DistanceUnit
      | SortMode
      | boolean
      | undefined;
    order: SortOrder;
    unit: DistanceUnit;
    ignore_unmapped?: boolean;
    mode?: SortMode;
  };
}

export interface ScriptSort {
  _script: {
    type: ScriptValueType;
    order: SortOrder;
    script: {
      lang: ScriptLang;
      source: string;
      params: Record<string, unknown>;
    };
  };
}

export type SearcherSort =
  | "_score"
  | FieldSort
  | GeoDistanceSort
  | ScriptSort;
