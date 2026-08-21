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

import { createApiReference } from "@scalar/api-reference";
import "@scalar/api-reference/style.css";
import { useEffect, useRef, useState } from "react";

function useDarkMode(): boolean {
  const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  const [isDark, setIsDark] = useState<boolean>(mq?.matches ?? false);

  useEffect(() => {
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark;
}

const BASE_URL = import.meta.env.BASE_URL;
const SPEC_URL = `${BASE_URL}${import.meta.env.VITE_SPEC_FILE ?? "admin.yaml"}`;
const LOGO_DARK = `${BASE_URL}logo-dark.png`;
const LOGO_LIGHT = `${BASE_URL}logo-light.png`;
const APP_NAME = import.meta.env.VITE_APP_NAME;

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();

  useEffect(() => {
    if (!containerRef.current) return;

    const { destroy } = createApiReference(containerRef.current, {
      spec: { url: SPEC_URL },
      darkMode: false,
      theme: "none",
      layout: "modern",
      forceDarkModeState: isDark ? "dark" : "light",
      hideDownloadButton: true,
      defaultOpenAllTags: true,
      defaultOpenFirstTag: true,
      hideDarkModeToggle: true,
      hideModels: true,
      hideTestRequestButton: true,
      expandAllResponses: true,
      hideClientButton: true,
      isEditable: false,
      showDeveloperTools: "never",
      agent: { disabled: true },
      defaultHttpClient: {
        targetKey: "shell",
        clientKey: "curl",
      },
      hiddenClients: true,
      mcp: {
        disabled: true,
      },
      customCss: `
        .references-footer,
        a[href*="scalar.com"],
        [class*="powered"] {
          display: none !important;
        }

        div:has(> .badge) {
          margin-bottom: 10px;
        }

        .scalar-app > aside > div:first-child > button:last-child {
          display: none !important;
        }

        /* ── Logo dark / light ── */
        img[alt="${APP_NAME}"] {
          content: url('${isDark ? LOGO_DARK : LOGO_LIGHT}');
        }
      `,
    });

    const observer = new MutationObserver(() => {
      const target = containerRef.current
        ?.querySelector(".scalar-app > main")
        ?.querySelectorAll(":scope > div")[1]
        ?.querySelectorAll(":scope > div")[1]
        ?.querySelector(":scope > section:first-of-type > div:first-child");

      if (!target || target.querySelector(".app-logo")) return;

      const img = document.createElement("img");
      img.className = "app-logo";
      img.src = isDark ? LOGO_DARK : LOGO_LIGHT;
      img.alt = APP_NAME;
      img.style.cssText =
        "height: 40px; width: auto; display: block; margin-bottom: 30px;";

      target.insertBefore(img, target.firstChild);
      observer.disconnect();
    });

    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      destroy();
    };
  }, [isDark]);

  return <div ref={containerRef} style={{ height: "100vh", width: "100%" }} />;
}
