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

import { parse } from "@std/yaml";
import { ScribeError } from "@scribe/alchemy";
import { LANGUAGE } from "../workspace/scope.ts";
import type { AwaitingVersion, Dependencies } from "@scribe/alchemy";
import { Package } from "@scribe/alchemy";
import type { Manifest } from "@scribe/alchemy";

/** Raised when a manifest cannot be read. */
export class ManifestError extends ScribeError {}

const KEYS = new Set(["name", "description", "version", "dependencies"]);

/**
 * The manifest `source` spells, where `source` is the text of a `package.yaml`.
 *
 * @remarks
 * The manifest is data and the chain is where the rules live, so this reads the document, refuses
 * what is not a document, and hands everything else to {@link Package}. A name, a version and a
 * constraint are therefore refused with the same sentence whether they were written in YAML or in
 * TypeScript.
 *
 * Four keys and no more. Everything a package used to write down about its own tree is read off
 * that tree instead.
 *
 * @param where - The path the text came from, named in whatever is thrown.
 * @throws {ManifestError} When the document is not a mapping, when a required key is missing, or
 * when a key holds something other than what it is meant to.
 */
export function manifestFrom(source: string, where: string): Manifest {
  const document = read(source, where);

  for (const key of Object.keys(document)) {
    if (KEYS.has(key)) continue;
    throw new ManifestError(
      `${where} carries "${key}", which means nothing. A manifest holds ${[...KEYS].join(", ")}, and the rest is ` +
        `read from the package itself.`,
    );
  }

  const named = Package.named(text(document, "name", where));
  const description = optionalText(document, "description", where);
  const describing: AwaitingVersion = description === null ? named : named.describedAs(description);

  const versioned = describing.version(text(document, "version", where));

  const dependencies = mapping(document, "dependencies", where);
  return (
    dependencies === null ? versioned : versioned.dependsOn(dependencies as Dependencies)
  ).build();
}

/**
 * The manifest as TypeScript, for whatever needs one it can import.
 *
 * @remarks
 * The YAML is what a person writes and what makes a directory a package. This is the same thing in
 * the form the generated registrations are written in, so nothing at runtime has to parse YAML.
 */
export function manifestSource(manifest: Manifest): string {
  return `import { Package } from ${JSON.stringify(LANGUAGE)};\n\nexport default ${chainOf(manifest)};\n`;
}

/**
 * The manifest as the chain that rebuilds it, without the import that makes it a module.
 *
 * @remarks
 * The registrations put several of these in one file, so the expression and the module it may sit
 * in are written apart.
 */
export function chainOf(manifest: Manifest): string {
  const steps = [
    `Package.named(${JSON.stringify(manifest.name)})`,
    `.describedAs(${JSON.stringify(manifest.description)})`,
    `.version(${JSON.stringify(String(manifest.version))})`,
  ];

  if (manifest.dependencies.size > 0) {
    const asked = Object.fromEntries(
      [...manifest.dependencies].map(([name, held]) => [name, String(held)]),
    );
    steps.push(`.dependsOn(${JSON.stringify(asked)})`);
  }

  steps.push(".build()");
  return steps.join("");
}

function read(source: string, where: string): Record<string, unknown> {
  let document: unknown;
  try {
    document = parse(source);
  } catch (raised) {
    throw new ManifestError(
      `${where} is not readable as YAML: ${(raised as Error).message}`,
    );
  }

  if (
    typeof document !== "object" ||
    document === null ||
    Array.isArray(document)
  ) {
    throw new ManifestError(
      `${where} is not a mapping. It opens with "name:" and "version:".`,
    );
  }

  return document as Record<string, unknown>;
}

function text(
  document: Record<string, unknown>,
  key: string,
  where: string,
): string {
  const value = optionalText(document, key, where);
  if (value === null) throw new ManifestError(`${where} has no "${key}:".`);
  return value;
}

function optionalText(
  document: Record<string, unknown>,
  key: string,
  where: string,
): string | null {
  const value = document[key];
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value !== "") return value;

  if (typeof value === "number") {
    throw new ManifestError(
      `${where} holds "${key}: ${value}", which YAML reads as a number rather than as text. ` +
        `Three numbers separated by dots are text on their own, as in "1.0.0"; anything shorter has to be quoted.`,
    );
  }

  throw new ManifestError(
    `${where} holds "${key}:" as something other than a word.`,
  );
}

function mapping(
  document: Record<string, unknown>,
  key: string,
  where: string,
): Record<string, string> | null {
  const value = document[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ManifestError(
      `${where} holds "${key}:" as something other than a block of names and values.`,
    );
  }

  const held: Record<string, string> = {};
  for (
    const [name, value_] of Object.entries(
      value as Record<string, unknown>,
    )
  ) {
    if (typeof value_ !== "string") {
      throw new ManifestError(
        `${where} holds "${key}.${name}:" as something other than a word.`,
      );
    }
    held[name] = value_;
  }

  return held;
}
