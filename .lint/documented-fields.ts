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

import ts from "typescript";
import type { Rule, Violation } from "./ast.ts";

/** Whether `node` carries an `export` modifier. */
function isExported(
  node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.ClassDeclaration,
): boolean {
  return !!ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

/** Whether `node` carries a JSDoc comment immediately above it. */
function hasDocComment(node: ts.Node): boolean {
  return ts.getJSDocCommentsAndTags(node).length > 0;
}

/**
 * Whether `node` is a private class member: name-mangled with `#`, or carrying the `private`
 * keyword.
 *
 * @remarks
 * A private member is never part of the surface a caller reads from the outside, so it falls
 * outside the convention this rule checks, the same way an internal declaration falls outside
 * "ce qui est exporté se documente" in `rules/commun/comments.md`.
 */
function isPrivateMember(
  node: ts.PropertyDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.MethodDeclaration,
): boolean {
  if (ts.isPrivateIdentifier(node.name)) return true;

  return !!ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword);
}

/** The literal name a property or accessor is declared under, when it has one worth reporting. */
function memberName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;

  return undefined;
}

function fieldMessage(name: string): string {
  return `Field "${name}" carries no documentation. An exported interface, type or class ` +
    `documents every field it has, not only the ones with something to say: a block half ` +
    `documented reads as a claim that the silent fields carry no provenance and no invariant, ` +
    `when the truth is only that nobody has looked at them yet.`;
}

function methodMessage(name: string): string {
  return `Method "${name}" carries no documentation. A class exported from this codebase ` +
    `documents every method it declares the same way it documents every field: a caller reads ` +
    `the method from the outside before ever opening the body, and a silent method reads as one ` +
    `nobody has reviewed rather than one with nothing to say.`;
}

function declarationMessage(kind: string, name: string): string {
  return `${kind} "${name}" carries no documentation of its own, above the declaration. A fully ` +
    `documented member list does not say what the whole shape is for: an exported interface, ` +
    `type or class needs the same one-sentence summary any other exported declaration would, ` +
    `before a caller ever reaches a single field or method.`;
}

/** Flags every undocumented `PropertySignature` among `members`. */
function checkPropertyMembers(members: ts.NodeArray<ts.TypeElement>, violations: Violation[]): void {
  for (const member of members) {
    if (!ts.isPropertySignature(member)) continue;

    const name = memberName(member.name);
    if (name === undefined) continue;

    if (!hasDocComment(member)) violations.push({ node: member, message: fieldMessage(name) });
  }
}

/**
 * Flags every undocumented field of `node`, skipping private ones.
 *
 * @remarks
 * A getter and its setter are read as one field, the way `rules/dart/comments.md` already treats
 * them for Dart: a documented getter excuses an undocumented setter of the same name, and the
 * other way around, so the rule never asks for the same sentence twice.
 */
function checkClassMembers(node: ts.ClassDeclaration, violations: Violation[]): void {
  const accessors = new Map<string, { documented: boolean; node: ts.Node }>();

  for (const member of node.members) {
    if (ts.isPropertyDeclaration(member)) {
      if (isPrivateMember(member)) continue;

      const name = memberName(member.name);
      if (name === undefined) continue;

      if (!hasDocComment(member)) violations.push({ node: member, message: fieldMessage(name) });
    } else if (ts.isGetAccessor(member) || ts.isSetAccessor(member)) {
      if (isPrivateMember(member)) continue;

      const name = memberName(member.name);
      if (name === undefined) continue;

      const existing = accessors.get(name);
      const documented = hasDocComment(member);
      accessors.set(name, {
        documented: (existing?.documented ?? false) || documented,
        node: existing?.node ?? member,
      });
    } else if (ts.isMethodDeclaration(member)) {
      if (isPrivateMember(member)) continue;

      const name = memberName(member.name);
      if (name === undefined) continue;

      if (!hasDocComment(member)) violations.push({ node: member, message: methodMessage(name) });
    }
  }

  for (const [name, { documented, node: accessorNode }] of accessors) {
    if (!documented) violations.push({ node: accessorNode, message: fieldMessage(name) });
  }
}

/** Flags `node` itself when it carries no doc comment of its own, above its member list. */
function checkContainerDoc(
  node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.ClassDeclaration,
  kind: string,
  violations: Violation[],
): void {
  if (hasDocComment(node)) return;

  const name = node.name?.text ?? "<anonymous>";
  violations.push({ node, message: declarationMessage(kind, name) });
}

export const documentedFields: Rule = {
  name: "documented-fields",

  check(sourceFile, filename) {
    if (filename.endsWith(".test.ts")) return [];

    const violations: Violation[] = [];

    function walk(node: ts.Node): void {
      if (ts.isInterfaceDeclaration(node) && isExported(node)) {
        checkContainerDoc(node, "Interface", violations);
        checkPropertyMembers(node.members, violations);
      } else if (
        ts.isTypeAliasDeclaration(node) && isExported(node) && ts.isTypeLiteralNode(node.type)
      ) {
        checkContainerDoc(node, "Type", violations);
        checkPropertyMembers(node.type.members, violations);
      } else if (ts.isClassDeclaration(node) && isExported(node)) {
        checkContainerDoc(node, "Class", violations);
        checkClassMembers(node, violations);
      }

      ts.forEachChild(node, walk);
    }

    walk(sourceFile);
    return violations;
  },
};
