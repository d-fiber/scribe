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

import {
  AppLinkText,
  AppSeparator,
  AppText,
  useDarkMode,
} from "@app/hosting-ui";

interface DocLink {
  label: string;
  href: string;
}

interface DocEntry {
  id: string;
  title: string;
  description: string;
  color: string;
  iconPath: string;
  links: DocLink[];
}

// The portal knows no surface of its own. `gen docs` writes them into its
// manifest and the build injects them here. Only the presentation stays local.
const PALETTE = ["#5b4fcf", "#0d8fcc", "#0f9d6b", "#c2410c", "#a21caf"];

const ICONS = [
  "M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z",
  "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
];

type ManifestSurface = {
  key: string;
  title: string;
  description: string;
};

const BASE_PATH = import.meta.env.VITE_BASE_PATH ?? "/developers/docs";
const APP_NAME = import.meta.env.VITE_APP_NAME ?? "";

const SURFACES: ManifestSurface[] = JSON.parse(
  import.meta.env.VITE_SURFACES ?? "[]",
);

const DOCS: DocEntry[] = SURFACES.map((surface, index) => ({
  id: surface.key,
  title: surface.title,
  description: surface.description,
  color: PALETTE[index % PALETTE.length],
  iconPath: ICONS[index % ICONS.length],
  links: [
    {
      label: `${surface.title} →`,
      href: `${BASE_PATH}/${surface.key}`,
    },
  ],
}));

export function Landing() {
  const isDark = useDarkMode();
  const logo = `${import.meta.env.BASE_URL}${isDark ? "logo-dark.png" : "logo-light.png"}`;

  return (
    <>
      <nav>
        <div className="nav-inner">
          <img src={logo} alt="Logo" />
        </div>
      </nav>

      <main>
        <AppText.largeTitle label={`${APP_NAME} Developer Documentation`} as="h1" />

        <AppSeparator.size32 />

        <div className="docs-grid">
          {DOCS.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div className="card-header">
                <span className="card-icon" style={{ background: doc.color }}>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d={doc.iconPath} />
                  </svg>
                </span>
                <AppText.body2Strong label={doc.title} as="h2" />
              </div>

              <AppText.body2 label={doc.description} color="secondary" as="p" />

              <div className="card-links">
                {doc.links.map((link) => (
                  <AppLinkText.body2
                    key={link.href}
                    label={link.label}
                    href={link.href}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
