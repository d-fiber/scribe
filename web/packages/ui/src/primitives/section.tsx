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

import React from "react";
import { AppSeparator } from "./separator.tsx";
import { AppSpacing } from "./spacing.tsx";
import { AppText } from "./text.tsx";

interface SectionRowPrefix {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export interface SectionRowItem {
  prefix: SectionRowPrefix;
  suffix: React.ReactNode;
}

export interface SectionItem {
  label: string;
}

type AppSectionProps = { item: SectionItem } | { rows: SectionRowItem[] };

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 500,
  background: "var(--app-surface-fill)",
  borderRadius: 10,
  border: "1px solid var(--app-outline-border)",
  overflow: "hidden",
  paddingLeft: 16,
  paddingRight: 16,
  boxSizing: "border-box",
};

export function AppSection(props: AppSectionProps) {
  if ("item" in props) {
    return (
      <div
        style={{ ...containerStyle, padding: "14px 20px", textAlign: "center" }}
      >
        <AppText.title3 label={props.item.label} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {props.rows.map((row, i) => (
        <React.Fragment key={i}>
          {i > 0 && <AppSeparator.size0 />}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
            }}
          >
            <div>
              {row.prefix.icon && (
                <div style={{ marginBottom: 4 }}>{row.prefix.icon}</div>
              )}
              <AppText.body2 label={row.prefix.title} color="primary" />
              {row.prefix.subtitle && (
                <>
                  <AppSpacing.size4 />
                  <AppText.caption1
                    label={row.prefix.subtitle}
                    color="secondary"
                  />
                </>
              )}
            </div>
            <div>{row.suffix}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
