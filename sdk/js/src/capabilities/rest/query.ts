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
import {
  type Filter,
  type FilterGroup,
  FilterGroupSchema,
  Operation,
  type Order,
  OrderSchema,
  RangeSchema,
  Rest,
  type QueryResult,
} from "../../../gen/scribe/host/packages/foundation/database/rest/protocol/rest_pb.ts";
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
    const result = await host.client().call(Rest.method.execute, {
      table: this.table,
      operation,
      select: [...this.state.select],
      where: create(FilterGroupSchema, {
        filters: [...this.state.where],
        groups: [...this.state.groups],
      }),
      order: [...this.state.order],
      range: create(RangeSchema, {
        limit: this.state.limit,
        offset: this.state.offset,
      }),
      single: this.state.single,
      countExact: this.state.countExact,
      payload: payload === undefined ? undefined : encodeJson(payload),
      onConflict: [...onConflict],
    });

    raiseOn(CAPABILITY, result.error);
    return result;
  }
}

export const rest = {
  from<Row extends object>(table: string): RestQuery<Row> {
    return new RestQuery<Row>(table);
  },

  async rpc<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T | null> {
    const result = await host.client().call(Rest.method.execute, {
      operation: Operation.RPC,
      rpcName: name,
      rpcArgs: encodeJson(args),
    });

    raiseOn(CAPABILITY, result.error);
    return decodeJson<T>(result.data);
  },
};
