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
              {row.prefix.icon && <div style={{ marginBottom: 4 }}>{row.prefix.icon}</div>}
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
