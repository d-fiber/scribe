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

import { BuilderError } from "../errors.ts";
import type { Constraint } from "../version/constraint.ts";
import type { Version } from "../version/version.ts";
import type { Registry } from "./registry.ts";

/** Raised when no set of versions answers every constraint at once. */
export class ResolutionError extends BuilderError {}

/** One package resolution settled on, and how it got into the answer. */
export interface ResolvedPackage {
  /** The package's name. */
  readonly name: string;

  /** The version settled on. */
  readonly version: Version;

  /**
   * Whether the project asked for this package by name.
   *
   * A transitive package is mounted, its SQL is played and its containers start, and it is still
   * unreachable from the project's own code. This is the flag that says which of the two it is.
   */
  readonly direct: boolean;
}

/** What resolution settled on, in full. */
export interface Resolution {
  /** Every package the project ends up with, sorted by name. */
  readonly packages: readonly ResolvedPackage[];
}

interface Requirement {
  readonly name: string;
  readonly constraint: Constraint;
  readonly from: string;
}

/**
 * The closure of `roots`, with one version chosen per package.
 *
 * @remarks
 * The search walks packages in name order and tries the versions of each from the highest down,
 * backtracking when a choice leaves a later package with nothing to pick. Two versions of the same
 * package are never an answer: a package here owns tables and containers, so a second copy would
 * mean a second schema under the same name rather than a second module in memory.
 *
 * Nothing is added on the project's behalf. A package that every project mounts is the caller's
 * business to put into `roots`.
 *
 * @throws {ResolutionError} When the constraints cannot all be met, naming the two that disagree.
 */
export function resolve(
  roots: ReadonlyMap<string, Constraint>,
  registry: Registry,
  rootLabel = "the project",
): Resolution {
  const failure = { message: null as string | null };
  const requirements: Requirement[] = [...roots].map(([name, constraint]) => ({
    name,
    constraint,
    from: rootLabel,
  }));

  const chosen = search(requirements, new Map(), registry, failure);
  if (chosen === null) {
    throw new ResolutionError(
      failure.message ?? "The constraints cannot all be met.",
    );
  }

  const packages = [...chosen]
    .map(([name, version]) => ({ name, version, direct: roots.has(name) }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return { packages };
}

function search(
  requirements: readonly Requirement[],
  chosen: ReadonlyMap<string, Version>,
  registry: Registry,
  failure: { message: string | null },
): Map<string, Version> | null {
  const wanted = narrow(requirements, failure);
  if (wanted === null) return null;

  for (const [name, constraint] of wanted) {
    const settled = chosen.get(name);
    if (settled !== undefined && !constraint.allows(settled)) return null;
  }

  const next = [...wanted.keys()].sort().find((name) => !chosen.has(name));
  if (next === undefined) return new Map(chosen);

  const constraint = wanted.get(next)!;
  if (!registry.knows(next)) {
    failure.message = `${requesterOf(next, requirements)} asks for "${next}", and no package of that name exists.`;
    return null;
  }

  const candidates = registry
    .versionsOf(next)
    .filter((version) => constraint.allows(version))
    .sort((left, right) => right.compareTo(left));

  if (candidates.length === 0) {
    const on = registry
      .versionsOf(next)
      .map((version) => version.toString())
      .join(", ");
    failure.message =
      `"${next}" has no version answering ${constraint}, asked for by ${requesterOf(next, requirements)}. ` +
      `What exists is ${on === "" ? "nothing" : on}.`;
    return null;
  }

  for (const candidate of candidates) {
    const grown = [...requirements];
    for (const [name, dependency] of registry.dependenciesOf(next, candidate)) {
      grown.push({
        name,
        constraint: dependency,
        from: `${next} ${candidate}`,
      });
    }

    const answer = search(
      grown,
      new Map(chosen).set(next, candidate),
      registry,
      failure,
    );
    if (answer !== null) return answer;
  }

  return null;
}

function narrow(
  requirements: readonly Requirement[],
  failure: { message: string | null },
): Map<string, Constraint> | null {
  const wanted = new Map<string, Constraint>();
  const held = new Map<string, Requirement>();

  for (const requirement of requirements) {
    const standing = wanted.get(requirement.name);
    if (standing === undefined) {
      wanted.set(requirement.name, requirement.constraint);
      held.set(requirement.name, requirement);
      continue;
    }

    const narrowed = standing.intersect(requirement.constraint);
    if (narrowed === null) {
      const other = held.get(requirement.name)!;
      failure.message = `"${requirement.name}" is asked for as ${other.constraint} by ${other.from} and as ` +
        `${requirement.constraint} by ${requirement.from}, and no version answers both.`;
      return null;
    }

    wanted.set(requirement.name, narrowed);
  }

  return wanted;
}

function requesterOf(
  name: string,
  requirements: readonly Requirement[],
): string {
  return (
    requirements.find((requirement) => requirement.name === name)?.from ??
      "the project"
  );
}
