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

import { Registry } from "../declare/registry.ts";
import { resolveValue } from "./value.ts";
import type { DeployValue, Loose, ValueLike } from "./value.ts";
import type { UnmodifiableList } from "../value/list.ts";

/** Where a service's image comes from: a reference already built, or a `Dockerfile` this builds. */
export type ServiceSource = ImageSource | BuildSource;

/** A service that runs an image pulled from a registry. */
export interface ImageSource {
  readonly kind: "image";

  /** The image reference, tag included, exactly as `docker pull` would take it. */
  readonly reference: string;
}

/** A service built from a `Dockerfile` living beside `deploy/deploy.ts`, under `deploy/services/<name>/`. */
export interface BuildSource {
  readonly kind: "build";

  /** The Dockerfile's name, resolved against the service's own directory. `Dockerfile` when left out. */
  readonly dockerfile?: string;
}

/** Runs the image at `reference`, pulled from a registry rather than built. */
export function Image(reference: string): ImageSource {
  return { kind: "image", reference };
}

/** Builds `dockerfile`, resolved against the service's own directory. `Dockerfile` when left out. */
export function Build(dockerfile?: string): BuildSource {
  return { kind: "build", dockerfile };
}

/**
 * How Compose restarts this service's container when it exits — Compose's own four values, in full.
 */
export type RestartPolicy = "unless-stopped" | "always" | "on-failure" | "no";

/**
 * A network `scribe_ops`' socle carries today, `app` for the API and whatever answers requests,
 * `data` for Postgres, Redis and NATS — kept for autocompletion, not as a hard boundary.
 *
 * @remarks
 * The pair belongs to the socle, a different repository this one does not read, so this type
 * cannot promise it is complete the way {@link LinuxCapability} can. It is unioned with
 * `(string & {})`, the standard way to keep a closed set's autocompletion while still accepting a
 * string outside it: a third network the socle adds tomorrow is not blocked here waiting for
 * `alchemy` to catch up, it is passed through as written, and `docker compose config` is what
 * refuses it if the socle turns out not to carry it after all. Every union in this module built
 * from a vocabulary this repository does not itself own follows {@link Loose} the same way.
 */
export type SocleNetwork = Loose<"app" | "data">;

/** One network this service attaches to, and the aliases it answers to on it. */
export interface NetworkAttachment {
  /** Extra hostnames this service answers to on this network, beyond its own service name. */
  readonly aliases?: UnmodifiableList<string>;
}

/** The networks a service attaches to: a bare list, or a map naming an attachment's aliases. */
export type ServiceNetworks =
  | UnmodifiableList<SocleNetwork>
  | Readonly<Partial<Record<SocleNetwork, NetworkAttachment>>>;

/** A Compose duration, a bare non-negative number followed by its unit — `"5s"`, `"250ms"`, `"2m"`, `"1h"`. */
export type DurationLiteral =
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`;

/** What proves a container is answering, polled from inside it. */
export interface HealthCheck {
  /** The command Compose runs inside the container to check it, `CMD`/`CMD-SHELL` included. */
  readonly command: UnmodifiableList<string>;

  /** How long Compose waits between two checks. */
  readonly interval: DurationLiteral;

  /** How long one check is given to answer before it counts as failed. */
  readonly timeout: DurationLiteral;

  /** How many failures in a row before the container counts as unhealthy. */
  readonly retries: number;

  /** How long a container is given to become healthy before a failure counts against it. */
  readonly startPeriod: DurationLiteral;
}

/** What a dependent service waits for before it starts. */
export type DependsOnCondition =
  /** The service has started; nothing about what it does once running is checked. */
  | "started"
  /** The service reports healthy on its own `healthcheck`. */
  | "healthy"
  /** The service ran to completion and exited with status zero, the shape a one-shot container takes. */
  | "completed";

/** A byte quantity in Docker's own log-size syntax: a bare number followed by its unit. */
export type ByteSize =
  | `${number}b`
  | `${number}k`
  | `${number}m`
  | `${number}g`;

/** How many bytes a log driver keeps, and how many rotated files it keeps them in. */
export interface LoggingOptions {
  /** The largest a single log file grows to before it rotates. `"10m"` when left out. */
  readonly maxSize?: ByteSize;

  /** How many rotated files are kept. `3` when left out. */
  readonly maxFile?: number;
}

/**
 * A language runtime `ops/sizing_rules.dart` already knows how to size a service by — kept for
 * autocompletion, not as a hard boundary; see {@link SocleNetwork} for why.
 *
 * @remarks
 * A sixth runtime is added on the `scribe_tools` side first, in `ops/sizing_rules.dart`, and this
 * union is free to lag behind it: `deploy.ts` can name it right away, and the render is what says
 * so plainly if the Dart side has not caught up yet, rather than TypeScript refusing a name it
 * cannot itself confirm is wrong.
 */
export type ServiceRuntime = Loose<
  "node" | "go" | "jvm" | "erlang" | "oneshot"
>;

/** A Kubernetes-style memory quantity, a bare number followed by `Mi` or `Gi`. */
export type MemoryQuantity = `${number}Mi` | `${number}Gi`;

/** What every `ServiceCapacity` carries, whichever of the two ways it weighs a CPU share. */
interface BaseCapacity {
  /** This service's share of the machine, relative to every other service's `weight`. */
  readonly weight: number;

  /** The language runtime this service's image carries, read by the sizing rules that size it. */
  readonly runtime: ServiceRuntime;

  /** The smallest memory this service is ever sized down to, on the smallest machine it still starts on. */
  readonly min: MemoryQuantity;

  /** The memory this service is sized to on a workstation, where headroom costs nothing. */
  readonly dev: MemoryQuantity;
}

/** A service whose containers are never replicated: one CPU share, fixed. */
export interface FixedCapacity extends BaseCapacity {
  /** This service's own CPU share, unaffected by how many cores the machine carries. */
  readonly cpuShares: number;
}

/** A service `ops/sizing_rules.dart` may run several containers of, spreading one CPU share between them. */
export interface ReplicatedCapacity extends BaseCapacity {
  /** The CPU share every container of this service divides between them, however many there are. */
  readonly cpuSharesTotal: number;
}

/**
 * How a service is weighed against every other one when a deployment's memory and CPU are shared
 * out — a fixed CPU share, or one spread across replicas, never both and never neither.
 *
 * @remarks
 * A single interface with `cpuShares?` and `cpuSharesTotal?` both optional would let a `deploy.ts`
 * give neither or both, which `ops/sizing_rules.dart` has no answer for: `resources.yaml` would
 * carry a `{{<name>_cpu_shares}}` token nothing computes. The union refuses that at the call site.
 */
export type ServiceCapacity = FixedCapacity | ReplicatedCapacity;

/** A path prefix a Kong route matches, always rooted and always closed with a trailing slash. */
export type RoutePath = `/${string}/`;

/** A route a Kong service answers requests on. */
export interface KongRoute {
  /** This route's own name, unique among the gateway's routes. */
  readonly name: string;

  /** The path prefixes this route matches. */
  readonly paths: UnmodifiableList<RoutePath>;

  /** Whether the matched prefix is removed before the request reaches this service. `true` when left out. */
  readonly stripPath?: boolean;
}

/**
 * A Kong plugin attached to a gateway service, and what it is configured with.
 *
 * @remarks
 * `config` is a plain object rather than a typed shape: each plugin, `cors`, `pre-function`,
 * `request-transformer`, reads its own configuration keys, and closing that vocabulary here would
 * mean redeclaring Kong's own plugin schema for every plugin a package might ever reach for. The
 * plugin's own documentation is the source of truth for what a given `name` accepts.
 */
export interface KongPlugin {
  /** The plugin's name, as Kong's own catalogue names it. */
  readonly name: string;

  /** The plugin's configuration, read exactly as Kong itself reads it. Empty when left out. */
  readonly config?: Readonly<Record<string, unknown>>;
}

/** A URL carrying its own scheme, `http://` or `https://`, so a bare host or a typo cannot pass for one. */
export type ServiceUrl = `http://${string}` | `https://${string}`;

/** What a service answers behind the gateway: its own URL, and the routes and plugins that reach it. */
export interface KongService {
  /** This gateway service's own name, unique among the package's Kong services. */
  readonly name: string;

  /** The internal URL Kong forwards a matched request to. */
  readonly url: ServiceUrl;

  /** The routes that reach this gateway service, at least one. */
  readonly routes: UnmodifiableList<KongRoute>;

  /** The plugins attached to this gateway service, in the order Kong is told to run them. Empty when left out. */
  readonly plugins?: UnmodifiableList<KongPlugin>;
}

/**
 * A Linux capability, `capabilities(7)`'s own vocabulary as of this file's writing, plus Docker's
 * own `ALL` — kept for autocompletion, not as a hard boundary; see {@link SocleNetwork} for why.
 *
 * @remarks
 * The kernel has added a capability after this list was written before — `CAP_BPF` and
 * `CAP_PERFMON` both postdate the version this was checked against — so treating this as final
 * would eventually refuse a real one. `security_opt`/`cap_add` is the one place in this module
 * where an unknown value is close to certainly a typo rather than a new kernel capability, and it
 * stays open anyway: Docker itself is the authority on whether a name is real, at `docker compose
 * config` time, and that check costs nothing to defer to.
 */
export type LinuxCapability = Loose<
  | "ALL"
  | "AUDIT_CONTROL"
  | "AUDIT_WRITE"
  | "BLOCK_SUSPEND"
  | "CHOWN"
  | "DAC_OVERRIDE"
  | "DAC_READ_SEARCH"
  | "FOWNER"
  | "FSETID"
  | "IPC_LOCK"
  | "IPC_OWNER"
  | "KILL"
  | "LEASE"
  | "LINUX_IMMUTABLE"
  | "MAC_ADMIN"
  | "MAC_OVERRIDE"
  | "MKNOD"
  | "NET_ADMIN"
  | "NET_BIND_SERVICE"
  | "NET_BROADCAST"
  | "NET_RAW"
  | "SETFCAP"
  | "SETGID"
  | "SETPCAP"
  | "SETUID"
  | "SYS_ADMIN"
  | "SYS_BOOT"
  | "SYS_CHROOT"
  | "SYS_MODULE"
  | "SYS_NICE"
  | "SYS_PACCT"
  | "SYS_PTRACE"
  | "SYS_RAWIO"
  | "SYS_RESOURCE"
  | "SYS_TIME"
  | "SYS_TTY_CONFIG"
  | "SYSLOG"
  | "WAKE_ALARM"
>;

/** What `Service` takes: everything one Compose container and its sizing need. */
export interface ServiceOptions {
  /** Where this service's image comes from. */
  readonly source: ServiceSource;

  /** The networks this service attaches to. */
  readonly networks: ServiceNetworks;

  /** How Compose restarts this service when it exits. `"unless-stopped"` when left out. */
  readonly restart?: RestartPolicy;

  /** The Compose profiles this service starts under. Always on when left out. */
  readonly profiles?: UnmodifiableList<string>;

  /** `security_opt` entries this service's container carries. None when left out. */
  readonly securityOpt?: UnmodifiableList<string>;

  /** Linux capabilities dropped from this service's container. None when left out. */
  readonly capDrop?: UnmodifiableList<LinuxCapability>;

  /** Linux capabilities added back to this service's container, beyond what `capDrop` removed. None when left out. */
  readonly capAdd?: UnmodifiableList<LinuxCapability>;

  /**
   * `"<source>:<target>[:<mode>]"` volume mounts, Compose's own syntax.
   *
   * @remarks
   * A `<source>` that is not an absolute path, does not start with `./`, and does not start with
   * `{{` is a named volume: it is collected and declared once under the stack's top-level
   * `volumes:`, so the same name mounted by two services never needs declaring twice, and never
   * drifts from what is actually mounted.
   */
  readonly volumes?: UnmodifiableList<string>;

  /** This service's environment, by variable name. Empty when left out. */
  readonly environment?: Readonly<Record<string, ValueLike>>;

  /** What proves this service's container is answering. Never checked when left out. */
  readonly healthcheck?: HealthCheck;

  /** The services this one waits for, and what "waits for" means for each. Empty when left out. */
  readonly dependsOn?: Readonly<Record<string, DependsOnCondition>>;

  /** How this service's logs are kept. The framework's own default when left out. */
  readonly logging?: LoggingOptions;

  /** The command this service's container runs instead of its image's own entrypoint. The image's own when left out. */
  readonly command?: UnmodifiableList<string>;

  /** Resource limits raised for this service's container, by the POSIX limit they raise. None when left out. */
  readonly ulimits?: Readonly<Partial<Record<UlimitName, UlimitValue>>>;

  /**
   * How this service is weighed when a deployment sizes memory and CPU.
   *
   * @remarks
   * Left out, this service takes no share of a deployment's sizing at all: it carries no
   * `capacity.yaml`, `resources.yaml` or `replicas.yaml`, the same as a service the framework
   * never scales today.
   */
  readonly capacity?: ServiceCapacity;

  /**
   * Environment overrides read once a deployment has been sized, by variable name.
   *
   * @remarks
   * This is where a service reads back what its own sizing decided — a thread pool size, a worker
   * count — through {@link sizingToken}. It is written to `tuning.yaml` rather than folded into
   * `environment` because the two are read at different moments: `environment` is fixed at
   * `deploy.ts`'s own values, `tuning` is filled in after the sizing rules have run.
   */
  readonly tuning?: Readonly<Record<string, ValueLike>>;

  /** What this service answers behind the gateway. Not reachable through it when left out. */
  readonly kong?: KongService;
}

/**
 * A POSIX resource limit `ulimit` raises, the ones Docker exposes to a container — kept for
 * autocompletion, not as a hard boundary; see {@link SocleNetwork} for why.
 */
export type UlimitName = Loose<
  | "core"
  | "cpu"
  | "data"
  | "fsize"
  | "locks"
  | "memlock"
  | "msgqueue"
  | "nice"
  | "nofile"
  | "nproc"
  | "rss"
  | "rtprio"
  | "rttime"
  | "sigpending"
  | "stack"
>;

/** One resource limit a container is allowed to raise, its soft and its hard ceiling. */
export interface UlimitValue {
  /** The ceiling a process can raise itself to without a privileged call. */
  readonly soft: number;

  /** The ceiling nothing inside the container can raise past. */
  readonly hard: number;
}

/**
 * A service's options exactly as declared, with `environment` and `tuning` resolved to a
 * {@link DeployValue} each — a plain string included, as {@link LiteralValue} — so that whatever
 * reads a `DeclaredService` back finds one shape for a value rather than two.
 */
export interface ResolvedServiceOptions extends Omit<ServiceOptions, "environment" | "tuning"> {
  /** {@link ServiceOptions.environment}, every value resolved. Empty when none was declared. */
  readonly environment: Readonly<Record<string, DeployValue>>;

  /** {@link ServiceOptions.tuning}, every value resolved. Empty when none was declared. */
  readonly tuning: Readonly<Record<string, DeployValue>>;
}

/** A service exactly as `Service` declared it. */
export interface DeclaredService {
  /** The name this service is created under, and the container's own hostname on its networks. */
  readonly name: string;

  /** Everything the service was declared with. */
  readonly options: ResolvedServiceOptions;
}

/** Every service this package has declared, by the name it took. */
const declared = new Registry<DeclaredService>("service");

/** `options`, with `environment` and `tuning` resolved to a {@link DeployValue} each. */
function resolveOptions(options: ServiceOptions): ResolvedServiceOptions {
  return {
    ...options,
    environment: resolveMap(options.environment),
    tuning: resolveMap(options.tuning),
  };
}

/** `map`, or an empty object when left out, with every value resolved to a {@link DeployValue}. */
function resolveMap(
  map: Readonly<Record<string, ValueLike>> | undefined,
): Readonly<Record<string, DeployValue>> {
  const resolved: Record<string, DeployValue> = {};
  for (const [key, value] of Object.entries(map ?? {})) {
    resolved[key] = resolveValue(value);
  }
  return resolved;
}

/**
 * Declares a Compose service named `name`, described by `options`, without reaching anything.
 *
 * @remarks
 * One call renders every fragment `deploy/services/<name>/` carries today — `docker-compose.yaml`,
 * `capacity.yaml`, `resources.yaml`, `replicas.yaml`, `tuning.yaml`, `kong.yml` — because all of
 * them describe the same service, and a name split across several hand-written files is a name
 * that can drift between them. `resources.yaml` and `replicas.yaml` need nothing from `options`
 * beyond `capacity` itself: their content is the same three or four `{{<name>_...}}` tokens for
 * every sized service, computed from `name` by `ops/sizing_rules.dart`, so nothing here repeats
 * what that mechanism already knows how to name.
 *
 * @throws {DuplicateDeclarationError} When `name` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts ignore
 * Service("imgproxy", {
 *   source: Image("darthsim/imgproxy:v3.30.1"),
 *   networks: ["app"],
 *   volumes: ["storage-data:/var/lib/storage:ro"],
 *   environment: { IMGPROXY_BIND: ":5001" },
 *   capacity: { weight: 280, runtime: "go", min: "64Mi", dev: "256Mi", cpuShares: 1024 },
 * });
 * ```
 */
export function Service(
  name: string,
  options: ServiceOptions,
): DeclaredService {
  return declared.declare(name, { name, options: resolveOptions(options) });
}

/** Every service this package has declared, in the order it declared them. */
export function declaredServices(): UnmodifiableList<DeclaredService> {
  return declared.all();
}

/** Forgets every declared service, which is what a test does between cases. */
export function forgetServices(): void {
  declared.forget();
}
