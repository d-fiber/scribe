// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

const sizes = {
  size0: 0,
  size4: 4,
  size8: 8,
  size12: 12,
  size16: 16,
  size24: 24,
  size32: 32,
  size40: 40,
  size64: 64,
} as const;

type SpacingSize = keyof typeof sizes;

function make(size: SpacingSize) {
  return function AppSpacingVariant() {
    const px = sizes[size];
    if (px === 0) return null;
    return <div style={{ height: px }} aria-hidden />;
  };
}

export const AppSpacing = {
  size0: make("size0"),
  size4: make("size4"),
  size8: make("size8"),
  size12: make("size12"),
  size16: make("size16"),
  size24: make("size24"),
  size32: make("size32"),
  size40: make("size40"),
  size64: make("size64"),
} as const;
