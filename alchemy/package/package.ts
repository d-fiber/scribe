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
import { artefactPathProblem, NO_ARTEFACTS, normaliseArtefactPath } from "./artefacts.ts";
import type { Artefacts, DatabaseArtefacts } from "./artefacts.ts";
import { Constraint } from "./constraint.ts";
import { Version } from "./version.ts";
import type { Manifest } from "./manifest.ts";
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

/** The packages a manifest asks for, from a package name to the constraint it accepts. */
export type Dependencies = Readonly<Record<string, string>>;

/** The SQL a package hands over, as a manifest writes the three paths. */
export interface DatabaseDeclaration {
  /** Where the SQL played once, at the build of the database container, is harvested from. */
  readonly init?: string;

  /** Where the SQL played at every start is harvested from. */
  readonly migrations?: string;

  /** Where the SQL played before anything else is harvested from. */
  readonly provisioning?: string;
}

/** What a package hands the stack, as a manifest writes it. */
export interface ArtefactsDeclaration {
  /** The SQL this package poses, left out when it poses none. */
  readonly db?: DatabaseDeclaration;

  /** The directory holding the `.proto` files, left out when it speaks to no worker. */
  readonly protocol?: string;

  /** The service directories this package contributes, one per service, in the order written. */
  readonly services?: readonly string[];
}

/** The last step, once everything required has been said. */
export interface Buildable {
  /** The manifest, closed against further change. */
  build(): Manifest;
}

/** The point where a package may still say what it hands the stack. */
export interface AwaitingArtefacts extends Buildable {
  /**
   * Declares the SQL, the `.proto` files and the services this package hands the stack.
   *
   * @remarks
   * A package that hands over none of them never takes this step, and its manifest says so by
   * carrying no `scribe:` block. Nothing falls back on a conventional path.
   *
   * @throws {DeclarationError} When a path is absolute, when it climbs out of the package, when it
   * is written empty, or when two service entries name one place.
   */
  hands(artefacts: ArtefactsDeclaration): Buildable;
}

/** The point where a package may still say what it depends on. */
export interface AwaitingDependencies extends AwaitingArtefacts {
  /**
   * Declares the packages this one may import, and the versions it accepts of each.
   *
   * @throws {DeclarationError} When a name is not a package name, when the package asks for
   * itself, or when a constraint cannot be read.
   */
  dependsOn(dependencies: Dependencies): AwaitingArtefacts;
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
  implements
    AwaitingDescription,
    AwaitingVersion,
    AwaitingFramework,
    AwaitingDependencies,
    AwaitingArtefacts,
    Buildable {
  readonly #name: string;
  #description: string = DEFAULT_DESCRIPTION;
  #version: Version | null = null;
  #scribe: Constraint | null = null;
  #dependencies: Map<string, Constraint> = new Map();
  #artefacts: Artefacts = NO_ARTEFACTS;

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

  describedAs(description: string): AwaitingVersion {
    if (description.trim() === "") {
      throw new DeclarationError(
        `"${this.#name}" describes itself with nothing. Say what it does, or say nothing.`,
      );
    }
    this.#description = description.trim();
    return this;
  }

  version(version: string): AwaitingFramework {
    this.#version = Version.parse(version);
    return this;
  }

  runsOn(constraint: string): AwaitingDependencies {
    this.#scribe = Constraint.parse(constraint);
    return this;
  }

  dependsOn(dependencies: Dependencies): AwaitingArtefacts {
    for (const [name, constraint] of Object.entries(dependencies)) {
      const problem = packageNameProblem(name);
      if (problem !== null) throw new DeclarationError(problem);
      if (name === this.#name) {
        throw new DeclarationError(
          `"${name}" asks for itself. A package cannot be its own dependency.`,
        );
      }
      this.#dependencies.set(name, Constraint.parse(constraint));
    }
    return this;
  }

  hands(artefacts: ArtefactsDeclaration): Buildable {
    this.#artefacts = Object.freeze({
      db: this.#database(artefacts.db),
      protocol: artefacts.protocol === undefined ? null : this.#path(artefacts.protocol, "scribe.protocol"),
      services: Object.freeze(this.#services(artefacts.services)),
    });
    return this;
  }

  #database(declared: DatabaseDeclaration | undefined): DatabaseArtefacts | null {
    if (declared === undefined) return null;

    const read = Object.freeze({
      init: declared.init === undefined ? null : this.#path(declared.init, "scribe.db.init"),
      migrations: declared.migrations === undefined ? null : this.#path(declared.migrations, "scribe.db.migrations"),
      provisioning: declared.provisioning === undefined
        ? null
        : this.#path(declared.provisioning, "scribe.db.provisioning"),
    });

    return read.init === null && read.migrations === null && read.provisioning === null ? null : read;
  }

  #services(declared: readonly string[] | undefined): string[] {
    const found: string[] = [];
    for (const [index, written] of (declared ?? []).entries()) {
      const path = this.#path(written, `scribe.services[${index}]`);
      if (found.includes(path)) {
        throw new DeclarationError(`"${this.#name}" names "${path}" twice under "scribe.services:".`);
      }
      found.push(path);
    }
    return found;
  }

  #path(written: string, key: string): string {
    const problem = artefactPathProblem(written);
    if (problem !== null) throw new DeclarationError(`"${this.#name}", at "${key}:": ${problem}`);
    return normaliseArtefactPath(written);
  }

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
      artefacts: this.#artefacts,
    });
  }
}
