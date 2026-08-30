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

/**
 * A place in a checked file a rule points at, and what it says about it.
 *
 * @remarks
 * `node` carries its own position: {@link runViolation} reads a line and a column from it, so a
 * rule never computes one itself.
 */
export interface Violation {
  /** The node to report against, its position read directly off it. */
  readonly node: ts.Node;

  /** What the rule has to say about `node`, printed as-is. */
  readonly message: string;
}

/**
 * One rule this repository imposes, run against every source file in scope.
 *
 * @remarks
 * A rule is a pure function of a parsed file and its path. It never reads a file itself, never
 * writes anything, and never reports past what it returns: {@link runRules} does the printing and
 * decides the exit code, so a rule stays testable on its own, the way {@link sealedZone} and
 * {@link memberOf} already were before this file existed.
 *
 * To add one: write a file next to `sealed-runtime.ts`, export a `const` of this shape, and add
 * it to the list in `rules.ts`. Nothing else has to change.
 */
export interface Rule {
  /** The name a violation is reported under. */
  readonly name: string;

  /** Every violation `sourceFile` carries, or an empty list when it carries none. */
  check(sourceFile: ts.SourceFile, filename: string): readonly Violation[];
}

/** One place a module is named by a string, whichever of the four forms wrote it. */
export interface ModuleSpecifier {
  /** The node to report against, if this specifier turns out to violate something. */
  readonly node: ts.Node;

  /** The specifier itself, exactly as written, quotes stripped. */
  readonly specifier: string;
}

/**
 * Walks every place `sourceFile` names another module by a string, calling `visit` once each.
 *
 * @remarks
 * Four shapes carry a specifier, and a rule that only cares about the string, not which of the
 * four wrote it, would otherwise have to walk all four itself: `import ... from "x"`,
 * `export ... from "x"`, `export * from "x"`, and the dynamic `import("x")`. TypeScript's own AST
 * does not unify them; this function does, once, so `sealed-runtime.ts` and the rest read a
 * single stream of `{ node, specifier }` pairs regardless of which form produced one.
 */
export function forEachModuleSpecifier(
  sourceFile: ts.SourceFile,
  visit: (found: ModuleSpecifier) => void,
): void {
  function walk(node: ts.Node): void {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      visit({ node, specifier: node.moduleSpecifier.text });
    } else if (
      ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
    ) {
      visit({ node, specifier: node.moduleSpecifier.text });
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      visit({ node, specifier: node.arguments[0].text });
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
}

/** Walks every identifier spelled `name`, anywhere in `sourceFile`, calling `visit` once each. */
export function forEachIdentifierNamed(
  sourceFile: ts.SourceFile,
  name: string,
  visit: (node: ts.Identifier) => void,
): void {
  function walk(node: ts.Node): void {
    if (ts.isIdentifier(node) && node.text === name) visit(node);
    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
}

/**
 * The named import or named re-export specifiers a declaration carries.
 *
 * @remarks
 * `node` is read loosely on purpose: {@link forEachModuleSpecifier} hands a rule a bare
 * `ts.Node`, and asking it to narrow the type first before it can call this would defeat the
 * point of unifying the four shapes in the first place. A node that is neither answers empty,
 * which is what a dynamic `import(...)` — no destructured binding to name — should answer too.
 */
export function namedSpecifiersOf(
  node: ts.Node,
): readonly (ts.ImportSpecifier | ts.ExportSpecifier)[] {
  if (ts.isImportDeclaration(node)) {
    const bindings = node.importClause?.namedBindings;
    return bindings && ts.isNamedImports(bindings) ? [...bindings.elements] : [];
  }

  if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
    return [...node.exportClause.elements];
  }

  return [];
}

/**
 * The name a specifier binds to at its source, aliasing aside.
 *
 * @remarks
 * `import { a as b }` and `export { a as b }` both carry `a` in `propertyName` and `b` in `name`
 * when they alias; an import or export that does not alias carries no `propertyName` at all, and
 * `name` is then both the source name and the local one. Either way, this is the name the source
 * module actually declared, which is the one a rule about what a directory keeps private cares
 * about — the local alias a caller chose says nothing about where the thing came from.
 */
export function sourceNameOf(specifier: ts.ImportSpecifier | ts.ExportSpecifier): string {
  return (specifier.propertyName ?? specifier.name).text;
}
