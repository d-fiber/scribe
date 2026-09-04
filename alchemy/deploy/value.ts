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
 * A value a deploy declaration can take, closed to what the rendered YAML is allowed to hold.
 *
 * @remarks
 * A plain string is always accepted where this type is, and is read as {@link LiteralValue}: the
 * five functions below exist for the five cases a plain string cannot say by itself, so a
 * `deploy.ts` never has to spell a `{{...}}` or `${...}` token out of thin air. `template` is the
 * escape hatch for a case none of the other four cover.
 */
export type DeployValue =
  | LiteralValue
  | EnvValue
  | SettingValue
  | SizingTokenValue
  | ResourceValue
  | TemplateValue;

/** A value taken exactly as written, with no substitution. */
export interface LiteralValue {
  /** Discriminates this {@link DeployValue} as a literal. */
  readonly kind: "literal";

  /** The text this value renders as. */
  readonly value: string;
}

/** A value read from the shell environment a stack starts under, `${NAME}` in the rendered YAML. */
export interface EnvValue {
  readonly kind: "env";

  /** The environment variable this value reads. */
  readonly name: string;
}

/** A value a project sets through `deploy/configuration.yaml`, declared by {@link Configuration}. */
export interface SettingValue {
  readonly kind: "setting";

  /** The key this value reads, one `Configuration` in the same file declared under `settings`. */
  readonly key: string;
}

/**
 * A value the framework computes for one service at render time — its memory limit, its CPU
 * share, its replica count — from what {@link Service} declared under `capacity`.
 *
 * @remarks
 * The token vocabulary itself is not closed here: `ops/sizing_rules.dart`, on the `scribe_tools`
 * side, is what decides which names it answers for a given service, and a name this does not
 * recognize is a `{{...}}` the render never fills in — the same failure a hand-written fragment
 * carrying a typo produces today. Closing that vocabulary is future work; what this closes today
 * is the four ways a value can arrive, so a plain, unmarked string can never accidentally hold a
 * token meant for another mechanism.
 */
export interface SizingTokenValue {
  readonly kind: "sizingToken";

  /** The token name, without its `{{` and `}}`. */
  readonly name: string;
}

/**
 * A value a deployment fills in from a placed resource's recipe — the host, the port, a bucket's
 * endpoint — once that recipe has answered.
 *
 * @remarks
 * `name` is either a resource this package itself required, through `Configuration`'s `requires`,
 * or `"postgres"`, the one resource every package may read without requiring it: the database the
 * socle always carries. `field` names one of the recipe's contract keys, `Recipe`'s own `contract`
 * for a required resource, or one of `host`, `port`, `database` for `"postgres"`.
 */
export interface ResourceValue {
  readonly kind: "resource";

  /** The resource this value reads, by the name it was required under, or `"postgres"`. */
  readonly name: string;

  /** The contract key this value reads. */
  readonly field: string;
}

/** Reads `field` off the resource placed under `name`, once a deployment's recipe has answered it. */
export function resource(name: string, field: string): ResourceValue {
  return { kind: "resource", name, field };
}

/**
 * Raw text carrying its own `{{...}}` or `${...}` markers, for a case the other four do not cover.
 *
 * @remarks
 * `env`, `setting`, `sizingToken` and `resource` each answer for exactly one token; a value built
 * from more than one, such as a connection string carrying both a password from the environment
 * and a host a placed resource fills in, has nothing closed left to declare it with. This is that
 * escape hatch, and nothing here validates what it holds — the same choice `schema/`'s
 * `defaultValue` makes for a raw Postgres expression.
 */
export interface TemplateValue {
  readonly kind: "template";

  /** The text this value renders as, verbatim. */
  readonly raw: string;
}

/** Reads `name` from the shell environment a stack starts under. */
export function env(name: string): EnvValue {
  return { kind: "env", name };
}

/** Reads the setting `key` names, declared by a `Configuration` in the same file. */
export function setting(key: string): SettingValue {
  return { kind: "setting", key };
}

/** Reads the sizing token `name` computes at render time. */
export function sizingToken(name: string): SizingTokenValue {
  return { kind: "sizingToken", name };
}

/** Carries `raw` verbatim into the rendered YAML, markers and all. */
export function template(raw: string): TemplateValue {
  return { kind: "template", raw };
}

/** A plain string, or one of the four {@link DeployValue} kinds — what most deploy options take. */
export type ValueLike = string | DeployValue;

/** `value` turned into a {@link DeployValue}, wrapping a plain string as {@link LiteralValue}. */
export function resolveValue(value: ValueLike): DeployValue {
  return typeof value === "string" ? { kind: "literal", value } : value;
}

/**
 * `Known`, widened to accept any string while an editor still offers `Known`'s own members first.
 *
 * @remarks
 * For a vocabulary this repository does not itself own — a network `scribe_ops`'s socle carries,
 * a runtime `ops/sizing_rules.dart` knows how to size, a Linux capability, a POSIX `ulimit` name —
 * closing the type strictly would refuse a real value the day the vocabulary grows somewhere this
 * repository cannot see happen. `Known | (string & {})` is the standard shape for that: a plain
 * `Known | string` collapses to `string` and an editor stops suggesting `Known`'s members at all,
 * while intersecting the open half with `{}` keeps the literals distinct enough that it still does.
 * A value outside `Known` is not silently wrong; it is passed through as written, and whatever
 * actually owns the vocabulary — Docker, Compose, `ops/sizing_rules.dart` — is what refuses it if
 * it turns out not to exist.
 */
// deno-lint-ignore ban-types
export type Loose<Known extends string> = Known | (string & {});
