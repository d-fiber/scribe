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

import { create, type MessageInitShape } from "@bufbuild/protobuf";
import {
  Database,
  type Filter,
  type FilterGroup,
  FilterGroupSchema,
  Operation,
  type Order,
  OrderSchema,
  type QueryResult,
  type QuerySchema,
  RangeSchema,
} from "../../../gen/scribe/engine/packages/foundation/protocol/database/database_pb.ts";
import { decodeJson, encodeJson } from "../../contracts/json.ts";
import { host } from "../channel.ts";
import { raiseOn } from "../error.ts";
import { type FilterBuilder, filters } from "./filter.ts";

const CAPABILITY = "rest";

interface QueryState {
  readonly select: readonly string[];
  readonly where: readonly Filter[];
  readonly groups: readonly FilterGroup[];
  readonly order: readonly Order[];
  readonly limit: number;
  readonly offset: number;
  readonly single: boolean;
  readonly countExact: boolean;
}

const EMPTY: QueryState = {
  select: [],
  where: [],
  groups: [],
  order: [],
  limit: 0,
  offset: 0,
  single: false,
  countExact: false,
};

export interface OrderOptions {
  readonly descending?: boolean;
  readonly nullsFirst?: boolean;
}

export interface Page<Row> {
  readonly rows: readonly Row[];
  readonly count: number;
}

export class RestQuery<Row extends object> {
  constructor(
    readonly table: string,
    readonly state: QueryState = EMPTY,
  ) {}

  select(...columns: readonly (keyof Row & string)[]): RestQuery<Row> {
    return this.#with({ select: columns });
  }

  where(build: (columns: FilterBuilder<Row>) => Filter | readonly Filter[]): RestQuery<Row> {
    const produced = build(filters<Row>());
    const added = Array.isArray(produced) ? produced : [produced as Filter];
    return this.#with({ where: [...this.state.where, ...added] });
  }

  either(build: (columns: FilterBuilder<Row>) => readonly Filter[]): RestQuery<Row> {
    const group = create(FilterGroupSchema, {
      filters: [...build(filters<Row>())],
      disjunction: true,
    });
    return this.#with({ groups: [...this.state.groups, group] });
  }

  order(column: keyof Row & string, options: OrderOptions = {}): RestQuery<Row> {
    const entry = create(OrderSchema, {
      column,
      descending: options.descending ?? false,
      nullsFirst: options.nullsFirst ?? false,
    });
    return this.#with({ order: [...this.state.order, entry] });
  }

  limit(count: number): RestQuery<Row> {
    return this.#with({ limit: count });
  }

  offset(start: number): RestQuery<Row> {
    return this.#with({ offset: start });
  }

  range(from: number, to: number): RestQuery<Row> {
    return this.#with({ offset: from, limit: to - from + 1 });
  }

  async rows(): Promise<readonly Row[]> {
    const result = await this.#execute(Operation.SELECT);
    return decodeJson<Row[]>(result.data) ?? [];
  }

  async first(): Promise<Row | null> {
    const result = await this.#with({ single: true, limit: 1 }).#execute(Operation.SELECT);
    return decodeJson<Row>(result.data);
  }

  async page(): Promise<Page<Row>> {
    const result = await this.#with({ countExact: true }).#execute(Operation.SELECT);
    return { rows: decodeJson<Row[]>(result.data) ?? [], count: Number(result.count) };
  }

  async insert(payload: Partial<Row> | readonly Partial<Row>[]): Promise<readonly Row[]> {
    const result = await this.#execute(Operation.INSERT, payload);
    return decodeJson<Row[]>(result.data) ?? [];
  }

  async update(payload: Partial<Row>): Promise<readonly Row[]> {
    const result = await this.#execute(Operation.UPDATE, payload);
    return decodeJson<Row[]>(result.data) ?? [];
  }

  async upsert(
    payload: Partial<Row> | readonly Partial<Row>[],
    onConflict: readonly (keyof Row & string)[] = [],
  ): Promise<readonly Row[]> {
    const result = await this.#execute(Operation.UPSERT, payload, onConflict);
    return decodeJson<Row[]>(result.data) ?? [];
  }

  async remove(): Promise<readonly Row[]> {
    const result = await this.#execute(Operation.DELETE);
    return decodeJson<Row[]>(result.data) ?? [];
  }

  #with(state: Partial<QueryState>): RestQuery<Row> {
    return new RestQuery<Row>(this.table, { ...this.state, ...state });
  }

  async #execute(
    operation: Operation,
    payload?: unknown,
    onConflict: readonly string[] = [],
  ): Promise<QueryResult> {
    const result = await host.client().call(
      Database.method.execute,
      described(this, operation, payload, onConflict),
    );

    raiseOn(CAPABILITY, result.error);
    return result;
  }
}

/** The wire description of `query`, as both a single call and a batch entry send it. */
function described<Row extends object>(
  query: RestQuery<Row>,
  operation: Operation,
  payload?: unknown,
  onConflict: readonly string[] = [],
): MessageInitShape<typeof QuerySchema> {
  return {
    table: query.table,
    operation,
    select: [...query.state.select],
    where: create(FilterGroupSchema, {
      filters: [...query.state.where],
      groups: [...query.state.groups],
    }),
    order: [...query.state.order],
    range: create(RangeSchema, {
      limit: query.state.limit,
      offset: query.state.offset,
    }),
    single: query.state.single,
    countExact: query.state.countExact,
    payload: payload === undefined ? undefined : encodeJson(payload),
    onConflict: [...onConflict],
  };
}

/** The rows each query of a batch answers, one array per query, in the order they were given. */
// deno-lint-ignore no-explicit-any -- RestQuery is invariant in Row, so no concrete supertype accepts every instantiation.
export type BatchRows<Q extends readonly RestQuery<any>[]> = {
  [K in keyof Q]: Q[K] extends RestQuery<infer Row> ? readonly Row[] : never;
};

export const rest = {
  from<Row extends object>(table: string): RestQuery<Row> {
    return new RestQuery<Row>(table);
  },

  /**
   * The rows every query of `queries` matches, read in one call to the host.
   *
   * @remarks
   * Three reads written as three `rows()` calls pay three round trips to the host, and on the
   * worker path that hop costs more than the read itself. Given together they pay one.
   *
   * The host runs them concurrently, so this is for queries that do not read what another one in
   * the same batch writes.
   *
   * @throws {CapabilityError} When any query of the batch was refused. The first refusal raises,
   * so a batch either answers every row or none.
   *
   * @example
   * ```ts
   * const [brands, users] = await rest.all([
   *   rest.from<Brand>("brands").select("id"),
   *   rest.from<User>("users").where((u) => u.active.is(true)),
   * ]);
   * ```
   */
  // deno-lint-ignore no-explicit-any -- see BatchRows: RestQuery is invariant in Row.
  async all<const Q extends readonly RestQuery<any>[]>(queries: Q): Promise<BatchRows<Q>> {
    if (queries.length === 0) return [] as unknown as BatchRows<Q>;

    const batch = await host.client().call(Database.method.executeBatch, {
      queries: queries.map((query) => described(query, Operation.SELECT)),
    });

    for (const result of batch.results) raiseOn(CAPABILITY, result.error);

    return batch.results.map((result) => decodeJson<unknown[]>(result.data) ?? []) as BatchRows<Q>;
  },

  async rpc<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T | null> {
    const result = await host.client().call(Database.method.execute, {
      operation: Operation.RPC,
      rpcName: name,
      rpcArgs: encodeJson(args),
    });

    raiseOn(CAPABILITY, result.error);
    return decodeJson<T>(result.data);
  },
};
