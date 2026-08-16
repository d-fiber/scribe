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

import type { InternalTRemoteConfigsRow } from "@scribe/host/dependencies/database/rest/gen/rows.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import type { RemoteConfigAudience } from "@scribe/core/contracts/enums.ts";
import { type Pagination, pagination } from "@scribe/core/contracts/pagination.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { Repository } from "../core/repository.ts";

type RemoteConfigRow = Pick<
  InternalTRemoteConfigsRow,
  | "remote_config_id"
  | "key"
  | "value"
  | "audience"
  | "description"
  | "is_active"
  | "hash"
  | "created_at"
  | "updated_at"
>;

const DEFAULT_PAGE_SIZE = 30;
const VISIBLE_AUDIENCES_RPC = "visible_remote_config_audiences";

export type RemoteConfigId = number;

export type RemoteConfigCallerType = "user" | "admin" | null;

export interface RemoteConfig {
  readonly id: RemoteConfigId;
  readonly key: string;
  readonly value: Record<string, unknown>;
  readonly audience: RemoteConfigAudience;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly hash: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CreateRemoteConfigInput {
  readonly key: string;
  readonly value: Record<string, unknown>;
  readonly audience?: RemoteConfigAudience;
  readonly description?: string;
  readonly isActive?: boolean;
}

export interface UpdateRemoteConfigInput {
  readonly value?: Record<string, unknown>;
  readonly audience?: RemoteConfigAudience;
  readonly description?: string | null;
  readonly isActive?: boolean;
}

export interface RemoteConfigPaginationOptions {
  readonly offset?: number;
  readonly size?: number;
}

export enum RemoteConfigError {
  NotFound = "not_found",
  Inactive = "inactive",
  Backend = "backend",
}

export interface RemoteConfigService {
  get(key: string): Promise<Result<RemoteConfig, RemoteConfigError>>;
  pagination(
    options?: RemoteConfigPaginationOptions,
  ): Promise<Result<Pagination<RemoteConfig>, RemoteConfigError>>;
  resolveVisible(
    callerType: RemoteConfigCallerType,
  ): Promise<Result<RemoteConfig[], RemoteConfigError>>;
  resolveKey(
    key: string,
    callerType: RemoteConfigCallerType,
  ): Promise<Result<RemoteConfig, RemoteConfigError>>;
  add(
    input: CreateRemoteConfigInput,
  ): Promise<Result<RemoteConfig, RemoteConfigError>>;
  update(
    key: string,
    input: UpdateRemoteConfigInput,
  ): Promise<Result<void, RemoteConfigError>>;
  remove(key: string): Promise<Result<void, RemoteConfigError>>;
}

export class RemoteConfigRepository extends Repository<RemoteConfigError> implements RemoteConfigService {
  protected override get backendError(): RemoteConfigError {
    return RemoteConfigError.Backend;
  }

  get(key: string): Promise<Result<RemoteConfig, RemoteConfigError>> {
    return this.guard(async () => {
      const row = await rest
        .internal_t__remote_configs()
        .where((f) => f.key.eq(key))
        .getOne();

      return row ? new OK(this.#domain(row)) : new Failure(RemoteConfigError.NotFound);
    });
  }

  pagination(
    options?: RemoteConfigPaginationOptions,
  ): Promise<Result<Pagination<RemoteConfig>, RemoteConfigError>> {
    return this.guard(async () => {
      const offset = options?.offset ?? 0;
      const size = options?.size ?? DEFAULT_PAGE_SIZE;

      const rows = await rest
        .internal_t__remote_configs()
        .select((s) => ({
          remote_config_id: s.remote_config_id,
          key: s.key,
          value: s.value,
          audience: s.audience,
          description: s.description,
          is_active: s.is_active,
          hash: s.hash,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }))
        .order("created_at", { ascending: false })
        .range(offset, offset + size)
        .get();

      const items = rows.map((row) => this.#domain(row));
      return new OK(pagination(items, offset, size));
    });
  }

  resolveVisible(
    callerType: RemoteConfigCallerType,
  ): Promise<Result<RemoteConfig[], RemoteConfigError>> {
    return this.guard(async () => {
      const audiences = await this.#audiences(callerType);

      const rows = await rest
        .internal_t__remote_configs()
        .select((s) => ({
          remote_config_id: s.remote_config_id,
          key: s.key,
          value: s.value,
          audience: s.audience,
          description: s.description,
          is_active: s.is_active,
          hash: s.hash,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }))
        .where((f) => [f.is_active.eq(true), f.audience.in(audiences)])
        .get();

      return new OK(rows.map((row) => this.#domain(row)));
    });
  }

  resolveKey(
    key: string,
    callerType: RemoteConfigCallerType,
  ): Promise<Result<RemoteConfig, RemoteConfigError>> {
    return this.guard(async () => {
      const [audiences, row] = await Promise.all([
        this.#audiences(callerType),
        rest
          .internal_t__remote_configs()
          .where((f) => f.key.eq(key))
          .getOne(),
      ]);

      if (!row) return new Failure(RemoteConfigError.NotFound);
      if (!audiences.includes(row.audience)) {
        return new Failure(RemoteConfigError.NotFound);
      }
      if (!row.is_active) return new Failure(RemoteConfigError.Inactive);

      return new OK(this.#domain(row));
    });
  }

  add(
    input: CreateRemoteConfigInput,
  ): Promise<Result<RemoteConfig, RemoteConfigError>> {
    return this.guard(async () => {
      const row = await rest.internal_t__remote_configs().insertOne({
        key: input.key,
        value: input.value,
        audience: input.audience,
        description: input.description ?? null,
        is_active: input.isActive ?? true,
      });

      return row ? new OK(this.#domain(row)) : new Failure(RemoteConfigError.Backend);
    });
  }

  update(
    key: string,
    input: UpdateRemoteConfigInput,
  ): Promise<Result<void, RemoteConfigError>> {
    return this.guard(async () => {
      const existing = await rest
        .internal_t__remote_configs()
        .select((s) => ({ key: s.key }))
        .where((f) => f.key.eq(key))
        .getOne();

      if (!existing) return new Failure(RemoteConfigError.NotFound);

      const ok = await rest
        .internal_t__remote_configs()
        .where((f) => f.key.eq(key))
        .update(this.#patch(input));

      return ok ? new OK() : new Failure(RemoteConfigError.Backend);
    });
  }

  remove(key: string): Promise<Result<void, RemoteConfigError>> {
    return this.guard(async () => {
      const removed = await rest
        .internal_t__remote_configs()
        .where((f) => f.key.eq(key))
        .deleteOne((s) => ({ key: s.key }));

      return removed ? new OK() : new Failure(RemoteConfigError.NotFound);
    });
  }

  #patch(input: UpdateRemoteConfigInput): {
    value?: Record<string, unknown>;
    audience?: RemoteConfigAudience;
    description?: string | null;
    is_active?: boolean;
  } {
    return {
      ...(input.value !== undefined && { value: input.value }),
      ...(input.audience !== undefined && { audience: input.audience }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    };
  }

  async #audiences(
    callerType: RemoteConfigCallerType,
  ): Promise<RemoteConfigAudience[]> {
    const { data, error } = await rest.rpc<string[]>(VISIBLE_AUDIENCES_RPC, {
      p_caller_type: callerType,
    });
    if (error) throw error;

    return (data ?? []) as unknown as RemoteConfigAudience[];
  }

  #domain(row: RemoteConfigRow): RemoteConfig {
    return {
      id: row.remote_config_id,
      key: row.key,
      value: row.value,
      audience: row.audience,
      description: row.description,
      isActive: row.is_active,
      hash: row.hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
