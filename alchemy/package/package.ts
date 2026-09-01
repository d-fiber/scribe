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

import { ScribeError } from "../error/scribe_error.ts";
import { Constraint } from "./constraint.ts";
import { Version } from "./version.ts";
import type { DependencySource, Manifest } from "./manifest.ts";
import { packageNameProblem } from "./name.ts";

/** Raised when a manifest says something a package is not allowed to say. */
export class DeclarationError extends ScribeError {}

/**
 * What a package says about itself before anybody has written the sentence.
 *
 * @remarks
 * It reads as an instruction because that is what it is. A description nobody replaced is a package
 * nobody described, and a placeholder that says so is more use than a plausible sentence that turns
 * out to describe nothing.
 */
export const DEFAULT_DESCRIPTION = "Say in one sentence what this package does.";

/**
 * One way {@link Dependencies} may write where a dependency comes from.
 *
 * @remarks
 * A version constraint on its own is the sdk form, the ordinary one, the same idea as a
 * `pubspec.yaml` writing `sdk: flutter` for a package the SDK already carries. A `path` names a
 * copy beside the package that depends on it, and a `git` names a repository, a `ref` optional the
 * way it is in a `pubspec.yaml`, and a `path` inside it optional too, for a repository that carries
 * more than one package.
 */
export type DependencyValue =
  | string
  | Readonly<{ path: string }>
  | Readonly<{ git: Readonly<{ url: string; ref?: string; path?: string }> }>;

/**
 * The packages a manifest asks for, from a package name to where it comes from.
 *
 * @remarks
 * A plain record rather than a list of `{ name, source }` pairs, because a manifest cannot declare
 * the same dependency twice: the key doing double duty as both the name and the uniqueness check is
 * what makes a duplicate a type error a caller writes, not a runtime refusal this class has to
 * detect.
 */
export type Dependencies = Readonly<Record<string, DependencyValue>>;

/** The last step, once everything required has been said. */
export interface Buildable {
  /** The manifest, closed against further change. */
  build(): Manifest;
}

/** The point where a package may still say what it depends on. */
export interface AwaitingDependencies extends Buildable {
  /**
   * Declares the packages this one may import, and the versions it accepts of each.
   *
   * @remarks
   * What a package hands the stack is not said here or anywhere else in the chain: it is read off
   * the package's `deploy/` tree, whose shape is fixed. This is the last step that carries a value.
   *
   * @throws {DeclarationError} When a name is not a package name, when the package asks for
   * itself, or when a constraint cannot be read.
   */
  dependsOn(dependencies: Dependencies): Buildable;
}

/** The point where the framework is the only thing that may follow. */
export interface AwaitingFramework {
  /**
   * Declares the framework versions this package accepts.
   *
   * @remarks
   * It is a step of its own rather than a value the build may skip, because a package that named
   * no framework would resolve against whichever checkout is on hand.
   *
   * @throws {VersionError} When `constraint` cannot be read as one.
   */
  runsOn(constraint: string): AwaitingDependencies;
}

/** The point where the version is the only thing that may follow. */
export interface AwaitingVersion {
  /**
   * Declares the version this copy of the package publishes.
   *
   * @throws {VersionError} When `version` is not three numbers separated by dots.
   */
  version(version: string): AwaitingFramework;
}

/** The point right after the name, where a package may say what it is for. */
export interface AwaitingDescription extends AwaitingVersion {
  /**
   * Declares what the package is for, in one sentence.
   *
   * @throws {DeclarationError} When the sentence is empty.
   */
  describedAs(description: string): AwaitingVersion;
}

/**
 * A package, declared one step at a time in the order its life takes.
 *
 * @remarks
 * A package author writes `package.yaml` and never this chain. It is what reads that file, what the
 * generated TypeScript is written in, and the one place the rules live: a name, a version and a
 * constraint are refused here whichever of the two forms they arrived in.
 *
 * Each step returns only what may legally follow it, so the order is a matter of types rather than
 * of convention, and no step can be taken twice.
 *
 * @example
 * ```ts
 * Package.named("realtime")
 *   .describedAs("Broadcasts a row's life to the callers a channel lets in.")
 *   .version("1.2.0")
 *   .runsOn("^3.0.0")
 *   .dependsOn({ audiences: "^1.0.0" })
 *   .build();
 * ```
 */
export class Package
  implements AwaitingDescription, AwaitingVersion, AwaitingFramework, AwaitingDependencies, Buildable {
  readonly #name: string;
  #description: string = DEFAULT_DESCRIPTION;
  #version: Version | null = null;
  #scribe: Constraint | null = null;
  #dependencies: Map<string, DependencySource> = new Map();

  private constructor(name: string) {
    this.#name = name;
  }

  /**
   * Opens the manifest of the package called `name`.
   *
   * @throws {DeclarationError} When `name` is not spelled the way a package name is spelled, or
   * when it is one the framework keeps for itself.
   */
  static named(name: string): AwaitingDescription {
    const problem = packageNameProblem(name);
    if (problem !== null) throw new DeclarationError(problem);
    return new Package(name);
  }

  /**
   * The {@link AwaitingDescription.describedAs} step: trims `description` and refuses it once it
   * is empty, so a placeholder left blank cannot silently become a manifest with no description.
   */
  describedAs(description: string): AwaitingVersion {
    if (description.trim() === "") {
      throw new DeclarationError(
        `"${this.#name}" describes itself with nothing. Say what it does, or say nothing.`,
      );
    }
    this.#description = description.trim();
    return this;
  }

  /** The {@link AwaitingVersion.version} step: parses `version` and stores it, or throws trying. */
  version(version: string): AwaitingFramework {
    this.#version = Version.parse(version);
    return this;
  }

  /** The {@link AwaitingFramework.runsOn} step: parses `constraint` and stores it, or throws trying. */
  runsOn(constraint: string): AwaitingDependencies {
    this.#scribe = Constraint.parse(constraint);
    return this;
  }

  /**
   * The {@link AwaitingDependencies.dependsOn} step: validates each name and source and refuses a
   * package that names itself, before storing the rest.
   */
  dependsOn(dependencies: Dependencies): Buildable {
    for (const [name, value] of Object.entries(dependencies)) {
      const problem = packageNameProblem(name);
      if (problem !== null) throw new DeclarationError(problem);
      if (name === this.#name) {
        throw new DeclarationError(
          `"${name}" asks for itself. A package cannot be its own dependency.`,
        );
      }
      this.#dependencies.set(name, parseDependencySource(name, value));
    }
    return this;
  }

  /**
   * The {@link Buildable.build} step: freezes everything declared so far into a `Manifest`.
   *
   * @throws {DeclarationError} When no version or no framework constraint was ever declared. The
   * chained interfaces already make both steps mandatory before `build` is reachable, so this is
   * the guard against a caller that got here some other way, not the path a correct chain takes.
   */
  build(): Manifest {
    if (this.#version === null) {
      throw new DeclarationError(`"${this.#name}" has no version.`);
    }
    if (this.#scribe === null) {
      throw new DeclarationError(`"${this.#name}" names no framework it runs on.`);
    }

    return Object.freeze({
      name: this.#name,
      description: this.#description,
      version: this.#version,
      scribe: this.#scribe,
      dependencies: Object.freeze(Object.fromEntries(this.#dependencies)),
    });
  }
}

/**
 * The source `name` names, as {@link DependencyValue} let it write it.
 *
 * @throws {DeclarationError} When `value` names both a path and a git repository, neither, an
 * unread key under either, or a git repository with no url.
 */
function parseDependencySource(name: string, value: DependencyValue): DependencySource {
  if (typeof value === "string") {
    return Object.freeze({ kind: "sdk" as const, constraint: Constraint.parse(value) });
  }

  const keys = Object.keys(value);
  if (keys.length !== 1 || (keys[0] !== "path" && keys[0] !== "git")) {
    throw new DeclarationError(
      `"${name}" is written as something other than a version, a path, or a git repository.`,
    );
  }

  if ("path" in value) {
    return Object.freeze({ kind: "path" as const, path: value.path });
  }

  const git = value.git;
  const unknown = Object.keys(git).filter((key) => key !== "url" && key !== "ref" && key !== "path");
  if (unknown.length > 0) {
    throw new DeclarationError(`"${name}" names ${unknown.join(", ")} under git, which is not read.`);
  }
  if (git.url.trim() === "") {
    throw new DeclarationError(`"${name}" gives git no url.`);
  }

  return Object.freeze({ kind: "git" as const, url: git.url, ref: git.ref ?? null, path: git.path ?? null });
}
