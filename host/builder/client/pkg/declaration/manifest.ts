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

import type {
  ArtefactsDeclaration,
  AwaitingArtefacts,
  AwaitingVersion,
  DatabaseDeclaration,
  Dependencies,
  Manifest,
} from "@scribe/alchemy";
import { ARTEFACTS_KEY, ARTEFACTS_KEYS, DATABASE_KEYS, handsOverNothing, Package, ScribeError } from "@scribe/alchemy";
import { parse } from "@std/yaml";
import { LANGUAGE } from "../../../scope.ts";

/** Raised when a manifest cannot be read. */
export class ManifestError extends ScribeError {}

const KEYS = new Set([
  "name",
  "description",
  "version",
  "environment",
  "dependencies",
  ARTEFACTS_KEY,
]);

/** The key, inside `environment:`, naming the framework a package is written against. */
const FRAMEWORK = "scribe";

/**
 * The manifest `source` spells, where `source` is the text of a `package.yaml`.
 *
 * @remarks
 * The manifest is data and the chain is where the rules live, so this reads the document, refuses
 * what is not a document, and hands everything else to {@link Package}. A name, a version and a
 * constraint are therefore refused with the same sentence whether they were written in YAML or in
 * TypeScript.
 *
 * Six keys and no more. What a package is made of is read off its tree; what it hands the stack is
 * declared under `${ARTEFACTS_KEY}:`, because nothing on a tree says whether a directory is meant
 * to reach one.
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
  const running = versioned.runsOn(framework(document, where));

  const dependencies = mapping(document, "dependencies", where);
  const asking: AwaitingArtefacts = dependencies === null ? running : running.dependsOn(dependencies as Dependencies);

  const artefacts = handedOver(document, where);
  return (artefacts === null ? asking : asking.hands(artefacts)).build();
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
    `.runsOn(${JSON.stringify(String(manifest.scribe))})`,
  ];

  if (Object.keys(manifest.dependencies).length > 0) {
    const asked = Object.fromEntries(
      Object.entries(manifest.dependencies).map(([name, held]) => [name, String(held)]),
    );
    steps.push(`.dependsOn(${JSON.stringify(asked)})`);
  }

  if (!handsOverNothing(manifest.artefacts)) {
    steps.push(`.hands(${JSON.stringify(declarationOf(manifest))})`);
  }

  steps.push(".build()");
  return steps.join("");
}

/**
 * What the manifest hands the stack, in the shape the chain takes it back in.
 *
 * @remarks
 * The manifest holds a null per path it never named, and the chain takes an absent key instead, so
 * the two shapes are not the same object with a different type. Writing the nulls out would make a
 * rebuilt manifest declare three paths where one was written.
 */
function declarationOf(manifest: Manifest): ArtefactsDeclaration {
  const { db, protocol, ops } = manifest.artefacts;

  return {
    ...(db === null ? {} : {
      db: {
        ...(db.init === null ? {} : { init: db.init }),
        ...(db.migrations === null ? {} : { migrations: db.migrations }),
        ...(db.provisioning === null ? {} : { provisioning: db.provisioning }),
      },
    }),
    ...(protocol === null ? {} : { protocol }),
    ...(ops.length === 0 ? {} : { ops: [...ops] }),
  };
}

/**
 * What `document` hands the stack, or null when it carries no block at all.
 *
 * @remarks
 * The paths themselves are refused by {@link Package}, so what is left here is the shape of the
 * block: which keys it may carry, and what kind of thing each one holds.
 */
function handedOver(document: Record<string, unknown>, where: string): ArtefactsDeclaration | null {
  const value = document[ARTEFACTS_KEY];
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ManifestError(`${where} holds "${ARTEFACTS_KEY}:" as something other than a block of paths.`);
  }

  const block = value as Record<string, unknown>;
  for (const key of Object.keys(block)) {
    if (ARTEFACTS_KEYS.includes(key)) continue;
    throw new ManifestError(
      `${where} holds "${ARTEFACTS_KEY}.${key}:", which means nothing. The block holds ` +
        `${ARTEFACTS_KEYS.join(", ")}, and a package that hands over none of them leaves it out.`,
    );
  }

  const declared: ArtefactsDeclaration = {
    ...(block["db"] === undefined || block["db"] === null ? {} : { db: sqlOf(block["db"], where) }),
    ...(block["protocol"] === undefined || block["protocol"] === null
      ? {}
      : { protocol: pathOf(block["protocol"], `${ARTEFACTS_KEY}.protocol`, where) }),
    ...(block["ops"] === undefined || block["ops"] === null ? {} : { ops: opsOf(block["ops"], where) }),
  };

  return Object.keys(declared).length === 0 ? null : declared;
}

function sqlOf(value: unknown, where: string): DatabaseDeclaration {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ManifestError(`${where} holds "${ARTEFACTS_KEY}.db:" as something other than a block of paths.`);
  }

  const block = value as Record<string, unknown>;
  for (const key of Object.keys(block)) {
    if (DATABASE_KEYS.includes(key)) continue;
    throw new ManifestError(
      `${where} holds "${ARTEFACTS_KEY}.db.${key}:", which means nothing. Postgres plays SQL at ` +
        `three moments, and the block names them: ${DATABASE_KEYS.join(", ")}.`,
    );
  }

  const read: Record<string, string> = {};
  for (const key of DATABASE_KEYS) {
    const held = block[key];
    if (held === undefined || held === null) continue;
    read[key] = pathOf(held, `${ARTEFACTS_KEY}.db.${key}`, where);
  }

  return read as DatabaseDeclaration;
}

function opsOf(value: unknown, where: string): string[] {
  if (!Array.isArray(value)) {
    throw new ManifestError(
      `${where} holds "${ARTEFACTS_KEY}.ops:" as something other than a list. One entry per service, ` +
        `each the directory holding that service's fragments.`,
    );
  }

  return value.map((entry, index) => pathOf(entry, `${ARTEFACTS_KEY}.ops[${index}]`, where));
}

function pathOf(value: unknown, key: string, where: string): string {
  if (typeof value !== "string") {
    throw new ManifestError(`${where} holds "${key}:" as something other than a path.`);
  }
  return value;
}

function framework(document: Record<string, unknown>, where: string): string {
  const value = document["environment"];
  if (value === undefined || value === null) {
    throw new ManifestError(
      `${where} has no "environment:". A package names the framework it was written against, so ` +
        `that a checkout it cannot run on is refused before anything is resolved:\n\n` +
        `environment:\n  ${FRAMEWORK}: "^1.0.0"`,
    );
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ManifestError(
      `${where} holds "environment:" as something other than a block of names and versions.`,
    );
  }

  const block = value as Record<string, unknown>;
  for (const key of Object.keys(block)) {
    if (key === FRAMEWORK) continue;
    throw new ManifestError(
      `${where} holds "environment.${key}:", which means nothing. The block names ` +
        `"${FRAMEWORK}:" and nothing else.`,
    );
  }

  return text(block, FRAMEWORK, `${where}, under "environment:"`);
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
