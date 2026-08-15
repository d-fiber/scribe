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

import type React from "react";
import type { AppColors } from "../types.ts";
import { themeMode } from "../theme.ts";

export interface AppCardProps {
  children: React.ReactNode;
}

export function makeAppCard(colors: AppColors) {
  const l = colors.light;
  const d = colors.dark;

  const AppCardStyle = [
    themeMode({
      tokens: {
        container: { light: l.surface.section, dark: d.surface.section },
      },
      attribute: "data-card",
      property: "background-color",
    }),
    themeMode({
      tokens: {
        container: { light: l.outline.border, dark: d.outline.border },
      },
      attribute: "data-card",
      property: "border-color",
    }),
    themeMode({
      tokens: {
        container: { light: l.action.primary, dark: d.action.primary },
      },
      attribute: "data-card",
      property: "border-top-color",
    }),
  ].join("\n");

  function AppCard({ children }: AppCardProps) {
    return (
      <div
        data-card="container"
        style={{
          background: l.surface.section,
          border: `1px solid ${l.outline.border}`,
          borderTop: `4px solid ${l.action.primary}`,
          borderRadius: "12px",
          padding: "48px 40px",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    );
  }

  return { AppCard, AppCardStyle };
}
