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

/**
 * The primitives every package and the framework itself are written with.
 *
 * @remarks
 * This is the vocabulary, and nothing in it reaches a disk, a network or a database. That is what
 * lets a package depend on it without depending on anything that runs: a package author imports
 * this and writes against it, the way a Flutter plugin imports the framework and never sees the
 * engine.
 *
 * What lives here is held to one rule: it must never break. A package compiled against one version
 * of these types is code nobody here can see, so a name that leaves changes what somebody else
 * already wrote.
 */

export { Future, unawaited } from "./primitives/async/future.ts";
export type { FutureOr } from "./primitives/async/future.ts";
export { Completer } from "./primitives/async/stream.ts";
export type { Stream } from "./primitives/async/stream.ts";
export { Bytes } from "./primitives/value/bytes.ts";
export type { Comparable } from "./primitives/value/comparable.ts";
export { DateTime, Now } from "./primitives/value/date_time.ts";
export type { NowSource } from "./primitives/value/date_time.ts";
export { Duration } from "./primitives/value/duration.ts";
export type { LatLng } from "./primitives/value/lat_lng.ts";
export type { List, UnmodifiableList } from "./primitives/value/list.ts";
export { Stopwatch } from "./primitives/value/stopwatch.ts";
export type { Uri } from "./primitives/value/uri.ts";
export { Uuid, Uuids } from "./primitives/value/uuid.ts";
export type { UuidSource } from "./primitives/value/uuid.ts";
export type { Expando, Finalizer, WeakReference } from "./primitives/value/weak.ts";
export { base64, base64Url, hex, json, utf8 } from "./primitives/value/convert.ts";
export type { BytesCodec, Codec } from "./primitives/value/convert.ts";

export { Pagination } from "./primitives/value/pagination.ts";
export type { PageRequest, PaginationJson } from "./primitives/value/pagination.ts";
export { Failure, Ok, okay } from "./primitives/value/result.ts";
export type { Result } from "./primitives/value/result.ts";

export { BindingError, Slot } from "./wiring/bind/slot.ts";
export { Lazy } from "./wiring/bind/lazy.ts";

export { Container, container } from "./wiring/di/container.ts";
export type { Token } from "./wiring/di/container.ts";
export { Singleton } from "./wiring/di/decorators.ts";
export type { SingletonOptions } from "./wiring/di/decorators.ts";

export { ExponentialBackoff } from "./primitives/async/backoff.ts";
export { TimeoutException, withDeadline, withDeadlineLite } from "./primitives/async/deadline.ts";
export { runPooled } from "./primitives/async/pool.ts";
export { Semaphore } from "./primitives/async/semaphore.ts";
export type { Release } from "./primitives/async/semaphore.ts";

export { Current, Currents } from "./wiring/scope/current.ts";
export type { CurrentDriver, CurrentStore } from "./wiring/scope/current.ts";

export { FormatException } from "./primitives/error/format_exception.ts";
export { Refusal, REFUSAL_KINDS } from "./primitives/error/refusal.ts";
export type { RefusalKind } from "./primitives/error/refusal.ts";
export { ScribeError } from "./primitives/error/scribe_error.ts";

export { DeclarationError, DEFAULT_DESCRIPTION, Package } from "./package/package.ts";
export type {
  AwaitingDependencies,
  AwaitingDescription,
  AwaitingFramework,
  AwaitingVersion,
  Buildable,
  Dependencies,
  DependencyValue,
} from "./package/package.ts";

export { mount } from "./package/manifest.ts";
export type {
  DependencySource,
  LifecycleStep,
  LifecycleSteps,
  Manifest,
  MountedPackage,
  PackageEntry,
} from "./package/manifest.ts";

export { isValidPackageName, packageNameProblem, RESERVED_PACKAGE_NAMES } from "./package/name.ts";

export {
  DATABASE_MOMENTS,
  DECLARES_EXPORT,
  DEPLOY,
  DEPLOY_ENTRIES,
  REQUIRED_DATABASE_MOMENTS,
  SERVICE_FRAGMENTS,
} from "./package/deploy.ts";

export { isPackageDirectory, MANIFEST, MANIFEST_KEYS, PACKAGE_LAYOUT, requiredEntries } from "./package/layout.ts";
export type { PackageDirectory } from "./package/layout.ts";

export { Constraint } from "./package/constraint.ts";
export { Version, VersionError } from "./package/version.ts";

export { DuplicateDeclarationError, Registry } from "./wiring/declare/registry.ts";

export { jobDecorator, JobRegistry } from "./wiring/declare/job.ts";
export type { JobHandler, RegisteredJob } from "./wiring/declare/job.ts";
export { Init, initRegistry } from "./wiring/lifecycle/init.ts";
export type { InitHandler, RegisteredInit } from "./wiring/lifecycle/init.ts";
export { Lifecycle } from "./wiring/lifecycle/lifecycle.ts";
export { Run, runRegistry } from "./wiring/lifecycle/run.ts";
export type { RegisteredRun, RunHandler } from "./wiring/lifecycle/run.ts";

export { cron, Crons, forgetCrons, installCrons } from "./port/cron.ts";
export type { CronDriver, CronOptions, DeclaredCron, DeclaredSchedule, DeclaredTimeOfDay } from "./port/cron.ts";
export { forgetHooks, hook, Hooks, openHooks } from "./port/hook.ts";
export type { DeclaredHook, HookDriver, HookOptions } from "./port/hook.ts";
export { forgetQueues, installQueues, queue, Queues } from "./port/queue.ts";
export type { DeclaredQueue, DeclaredQueueOptions, QueueDriver, QueueMessage } from "./port/queue.ts";
export { forgetTriggers, installTriggers, trigger, Triggers } from "./port/trigger.ts";
export type {
  Change,
  DeclaredChangeBase,
  DeclaredChangeHandler,
  DeclaredDeleteChange,
  DeclaredFieldChange,
  DeclaredInsertChange,
  DeclaredTransition,
  DeclaredTrigger,
  DeclaredTriggerOp,
  DeclaredTriggerOptions,
  DeclaredUpdateChange,
  TriggerDriver,
} from "./port/trigger.ts";

export { cache, Caches, DEFAULT_CACHE_DEADLINE } from "./port/cache.ts";
export type { Cache, CacheDriver, CacheOptions } from "./port/cache.ts";
export { claimOnce, Claims } from "./port/claim.ts";
export type { ClaimDriver, ClaimOptions, WhenUnavailable } from "./port/claim.ts";
export { rateLimit, RateLimiters } from "./port/rate_limit.ts";
export type { RateLimiter, RateLimiterDriver, RateLimitOptions, RateLimitOutcome } from "./port/rate_limit.ts";

export { FileSystems } from "./port/files.ts";
export type { FileSystem, FileSystemDriver, FileSystemEntity } from "./port/files.ts";

export { Environments } from "./port/env.ts";
export type { Environment } from "./port/env.ts";

export { Commands } from "./port/commands.ts";
export type { Command, CommandOptions, CommandResult } from "./port/commands.ts";

export { renderError } from "./primitives/diagnostic/render.ts";
export type { RenderOptions } from "./primitives/diagnostic/render.ts";
export { foldFrames, framesOf } from "./primitives/diagnostic/stack.ts";
export type { Frame } from "./primitives/diagnostic/stack.ts";

export { Databases, schema } from "./port/database.ts";
export type {
  ColumnFilter,
  Columns,
  DatabaseDriver,
  DeclaredDatabaseSchema,
  DeclaredFilterSpec,
  DeclaredTableShape,
  Filters,
  OrderOptions,
  Projected,
  Query,
  Tables,
} from "./port/database.ts";

export {
  declaredGrants,
  forgetGrants,
  Grant,
  GrantBuilder,
  GrantDeclaration,
  GrantObjectFactory,
  GrantWithOn,
  GrantWithPrivileges,
} from "./stack/schema/build/access/grant.ts";
export type {
  DeclaredGrant,
  GrantObject,
  GrantObjectKind,
  GrantOptions,
  GrantRole,
  GrantTargetKind,
  Privilege,
} from "./stack/schema/build/access/grant.ts";
export { declaredDrops, Drop, DropDeclaration, DropTarget, forgetDrops } from "./stack/schema/build/lifecycle/drop.ts";
export type { DeclaredDrop } from "./stack/schema/build/lifecycle/drop.ts";
export { SchemaEntry } from "./stack/schema/build/moment.ts";
export type { DbMoment, SchemaAddable } from "./stack/schema/build/moment.ts";
export {
  declaredExtensions,
  Extension,
  ExtensionBuilder,
  forgetExtensions,
} from "./stack/schema/build/objects/extension.ts";
export type { DeclaredExtension, ExtensionName, ExtensionOptions } from "./stack/schema/build/objects/extension.ts";
export {
  declaredSequences,
  forgetSequences,
  Sequence,
  SequenceBuilder,
} from "./stack/schema/build/objects/sequence.ts";
export type { DeclaredSequence, SequenceDataType, SequenceOwner } from "./stack/schema/build/objects/sequence.ts";
export { dbSchema, Schema, SchemaBatch, SchemaContentFactory } from "./stack/schema/build/schema.ts";
export {
  declaredIndexes,
  declaredPolicies,
  declaredTables,
  forgetIndexes,
  forgetPolicies,
  forgetTables,
  Table,
  TableBuilder,
  TableCheckBuilder,
  TableCheckFactory,
  TableExcludeBuilder,
  TableExcludeFactory,
  TableForeignKeyBuilder,
  TableForeignKeyFactory,
  TableGrantBuilder,
  TableGrantFactory,
  TableIndexBuilder,
  TableIndexFactory,
  TablePolicyBuilder,
  TablePolicyFactory,
  TablePrimaryKeyBuilder,
  TablePrimaryKeyFactory,
  TableRevokeBuilder,
  TableRevokeFactory,
  TableUniqueBuilder,
  TableUniqueFactory,
} from "./stack/schema/build/table/table.ts";
export type {
  CheckConstraint,
  DeclaredIndex,
  DeclaredPolicy,
  DeclaredTable,
  ExcludeConstraint,
  ExcludeElement,
  IndexAccessMethod,
  IndexColumn,
  IndexOptions,
  PolicyCommand,
  PolicyKind,
  PolicyOptions,
  PolicyRole,
  PrimaryKeyConstraint,
  TableForeignKey,
  TableGrant,
  TableIndex,
  TablePolicy,
  TableRevoke,
  UniqueConstraint,
} from "./stack/schema/build/table/table.ts";
export {
  CollatableColumnBuilder,
  ColumnBuilder,
  ColumnFactory,
  columnsOf,
  IdentityCapableColumnBuilder,
} from "./stack/schema/build/types/column.ts";
export type {
  ColumnCommonOptions,
  ColumnDefinition,
  ColumnMap,
  ColumnOptions,
  ColumnReference,
  ColumnRowType,
  ColumnType,
  ColumnTypeOptions,
  DeferrableOptions,
  GeneratedOptions,
  IdentityOptions,
  IntervalFields,
  RangeSubtype,
  ReferentialAction,
  ReferentialMatch,
  RowOf,
  ScalarTsType,
} from "./stack/schema/build/types/column.ts";
export { declaredEnums, Enum, EnumBuilder, forgetEnums } from "./stack/schema/build/types/enum.ts";
export type { DeclaredEnum } from "./stack/schema/build/types/enum.ts";
export { declaredTypes, forgetTypes, Type, TypeBuilder } from "./stack/schema/build/types/type.ts";
export type { DeclaredType } from "./stack/schema/build/types/type.ts";

export { env, resolveValue, resource, setting, sizingToken, template } from "./stack/common/value.ts";
export type {
  DeployValue,
  EnvValue,
  LiteralValue,
  Loose,
  ResourceValue,
  SettingValue,
  SizingTokenValue,
  TemplateValue,
  ValueLike,
} from "./stack/common/value.ts";

export { Build, declaredServices, forgetServices, Image, Service } from "./stack/service/build/service.ts";
export type {
  BuildSource,
  ByteSize,
  DeclaredService,
  DependsOnCondition,
  DurationLiteral,
  FixedCapacity,
  HealthCheck,
  ImageSource,
  KongPlugin,
  KongRoute,
  KongService,
  LinuxCapability,
  LoggingOptions,
  MemoryQuantity,
  NetworkAttachment,
  ReplicatedCapacity,
  ResolvedServiceOptions,
  RestartPolicy,
  RoutePath,
  ServiceCapacity,
  ServiceNetworks,
  ServiceOptions,
  ServiceRuntime,
  ServiceSource,
  ServiceUrl,
  SocleNetwork,
  UlimitName,
  UlimitValue,
} from "./stack/service/build/service.ts";

export { declaredRecipes, forgetRecipes, Recipe, RecipeClassFactory } from "./stack/recipe/build/recipe.ts";
export type {
  DeclaredRecipe,
  OutputsClass,
  RecipeClass,
  RecipeOptions,
  TerraformClass,
  TerraformDocument,
} from "./stack/recipe/build/recipe.ts";

export { declaredDeploy, Deploy, forgetDeploy, Role, Sql } from "./stack/deploy.ts";
export type {
  ConfigurationOptions,
  DeclaredDeploy,
  DeclaredRole,
  DeployDb,
  DeployOptions,
  DeploySchema,
  RawSql,
  RequiredResource,
  ResolvedConfigurationOptions,
  RoleAttribute,
  RoleOptions,
  SettingOptions,
} from "./stack/deploy.ts";

export { DB } from "./stack/schema/decorators/db.ts";
export { InitDB, initDbRegistry } from "./stack/schema/decorators/init.ts";
export type { InitDbHandler, RegisteredInitDb } from "./stack/schema/decorators/init.ts";
export { MigrationDB, migrationDbRegistry } from "./stack/schema/decorators/migration.ts";
export type { MigrationDbHandler, RegisteredMigrationDb } from "./stack/schema/decorators/migration.ts";
export { ProvisioningDB, provisioningDbRegistry } from "./stack/schema/decorators/provisioning.ts";
export type { ProvisioningDbHandler, RegisteredProvisioningDb } from "./stack/schema/decorators/provisioning.ts";

export { ListOf, Nested, Required } from "./network/api/body/mod.ts";
export type { BodyFromSchema, BodySchema, FormFromSchema, FormSchema, PrimitiveType } from "./network/api/body/mod.ts";

export {
  ClientProtocol,
  CoreProtocol,
  declaredProtocols,
  forgetProtocols,
  protocolDecorator,
  RuntimeProtocol,
} from "./protocol/decorators.ts";
export type { ProtocolSource, ProtoFamily, RegisteredProtocol } from "./protocol/decorators.ts";
export { declaredNodes, ProtoEnumMember, ProtoMessage, ProtoServiceMember } from "./protocol/members.ts";
export { Protocol, protocol, ProtocolBuilder, ProtocolContentFactory } from "./protocol/protocol.ts";
export type { DeclaredNode, ProtocolNode } from "./protocol/protocol.ts";
export { Message, MessageBuilder } from "./protocol/message/message.ts";
export type { DeclaredMessage } from "./protocol/message/message.ts";
export { RpcService, RpcServiceBuilder } from "./protocol/service/service.ts";
export type { DeclaredRpc, DeclaredRpcService } from "./protocol/service/service.ts";
export { EnumFactory, EnumValueBuilder, EnumValueFactory, EnumWithName, ProtoEnum } from "./protocol/types/enum.ts";
export type { DeclaredEnumValue, DeclaredProtoEnum } from "./protocol/types/enum.ts";
export { FieldBuilder, FieldFactory, fieldsOf, MapFieldBuilder, MapValueFactory } from "./protocol/types/field.ts";
export type { FieldDefinition, FieldMap, FieldType, MapKeyKind, ScalarKind } from "./protocol/types/field.ts";
