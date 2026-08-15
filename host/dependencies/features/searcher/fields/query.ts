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
  type EntityQueryPlan,
  Fuzziness,
  type MinimumShouldMatch,
  MultiMatchType,
  type SearcherQuery,
  type SearcherSort,
} from "../types.ts";

type Falsy = false | 0 | "" | null | undefined;

export function textMatch(text: string, fields: string[]): SearcherQuery {
  return {
    bool: {
      should: [
        {
          multi_match: {
            query: text,
            fields,
            type: MultiMatchType.PhrasePrefix,
          },
        },
        {
          multi_match: {
            query: text,
            fields,
            fuzziness: Fuzziness.auto(),
            prefix_length: 1,
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

export class QueryBuilder {
  #must: SearcherQuery = { match_all: {} };
  readonly #filter: SearcherQuery[] = [];
  readonly #mustNot: SearcherQuery[] = [];
  readonly #should: SearcherQuery[] = [];
  #minimumShouldMatch?: MinimumShouldMatch;
  #sort: SearcherSort[] = [];

  text(text: string | undefined, fields: string[]): this {
    if (text) this.#must = textMatch(text, fields);
    return this;
  }

  must(query: SearcherQuery | Falsy): this {
    if (query) this.#must = query;
    return this;
  }

  filter(query: SearcherQuery | Falsy): this {
    if (query) this.#filter.push(query);
    return this;
  }

  mustNot(query: SearcherQuery | Falsy): this {
    if (query) this.#mustNot.push(query);
    return this;
  }

  should(query: SearcherQuery | Falsy): this {
    if (query) this.#should.push(query);
    return this;
  }

  minimumShouldMatch(value: MinimumShouldMatch): this {
    this.#minimumShouldMatch = value;
    return this;
  }

  sort(clauses: SearcherSort | SearcherSort[]): this {
    this.#sort = Array.isArray(clauses) ? clauses : [clauses];
    return this;
  }

  build(): EntityQueryPlan {
    return {
      bool: {
        must: this.#must,
        ...(this.#filter.length ? { filter: this.#filter } : {}),
        ...(this.#mustNot.length ? { must_not: this.#mustNot } : {}),
        ...(this.#should.length ? { should: this.#should } : {}),
        ...(this.#minimumShouldMatch !== undefined ? { minimum_should_match: this.#minimumShouldMatch } : {}),
      },
      sort: this.#sort,
    };
  }
}

export function query(): QueryBuilder {
  return new QueryBuilder();
}
