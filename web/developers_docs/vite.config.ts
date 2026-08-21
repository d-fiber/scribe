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

import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import {
  GENERATED_DOCS,
  LANDING_MODE,
  PROJECT_ROOT,
  readManifest,
  requireAssets,
} from "./manifest.mjs";

type DocsSurface = {
  key: string;
  title: string;
  description: string;
  spec: string;
};

type DocsManifest = {
  appName: string;
  appNameSnake: string;
  basePath: string;
  surfaces: DocsSurface[];
};

function substituteAppName(content: string, manifest: DocsManifest): string {
  return content
    .replaceAll("${APP_NAME_SNAKE}", manifest.appNameSnake)
    .replaceAll("${APP_NAME}", manifest.appName);
}

const PROJECT_THEME = path.join(PROJECT_ROOT, "lib/public/theme/tokens.css");
const THEME_FALLBACK = path.resolve(
  __dirname,
  "../packages/ui/src/primitives/no-theme.css",
);

export default defineConfig(({ mode }) => {
  const manifest = readManifest() as DocsManifest;
  const isLanding = mode === LANDING_MODE;
  const surface = manifest.surfaces.find((entry) => entry.key === mode);

  if (!isLanding && !surface) {
    throw new Error(
      `unknown docs surface "${mode}" the manifest declares ${
        manifest.surfaces.map((entry) => entry.key).join(", ") || "none"
      }.`,
    );
  }

  // A variant carries only the spec it displays. The landing has none, and a
  // surface has its own. Copying the others makes the bundle heavier and
  // publishes one API on the domain of another.
  const yamlSources = surface
    ? [{ src: path.join(GENERATED_DOCS, surface.spec), rename: surface.spec }]
    : [];

  // The project's branding, shipped in every variant. `requireAssets()` fails
  // by naming the files that are missing, so the portal does not build on a
  // project that has not supplied its own.
  const assetTargets = requireAssets().map((src: string) => ({
    src,
    dest: ".",
  }));

  return {
    resolve: {
      alias: {
        "@project/theme.css": fs.existsSync(PROJECT_THEME)
          ? PROJECT_THEME
          : THEME_FALLBACK,
      },
    },
    define: {
      "import.meta.env.VITE_APP_NAME": JSON.stringify(manifest.appName),
      "import.meta.env.VITE_SPEC_FILE": JSON.stringify(surface?.spec ?? ""),
      "import.meta.env.VITE_SURFACES": JSON.stringify(
        JSON.stringify(manifest.surfaces),
      ),
      "import.meta.env.VITE_BASE_PATH": JSON.stringify(manifest.basePath),
    },
    base: isLanding ? `${manifest.basePath}/` : `${manifest.basePath}/${mode}/`,
    build: {
      outDir: path.join(GENERATED_DOCS, "dist", mode),
      emptyOutDir: true,
    },
    plugins: [
      react(),
      {
        name: "docs-title",
        transformIndexHtml: {
          order: "pre" as const,
          handler(html: string) {
            const title =
              surface?.title ?? `${manifest.appName} Developer Docs`;
            return html.replaceAll("%VITE_TITLE%", title);
          },
        },
      },
      viteStaticCopy({ targets: assetTargets }),
      ...(isLanding
        ? [
            {
              name: "landing-entry",
              transformIndexHtml: {
                order: "pre" as const,
                handler(html: string) {
                  return html.replace("/src/main.tsx", "/src/landing/main.tsx");
                },
              },
            },
          ]
        : [
            viteStaticCopy({
              targets: yamlSources.map(({ src, rename }) => ({
                src,
                dest: ".",
                rename,
                transform: (content: string) =>
                  substituteAppName(content, manifest),
              })),
            }),
            {
              name: "serve-yaml",
              configureServer(server) {
                for (const { src, rename } of yamlSources) {
                  server.middlewares.use(`/${rename}`, (_req, res) => {
                    const content = substituteAppName(
                      fs.readFileSync(src, "utf-8"),
                      manifest,
                    );
                    res.setHeader("Content-Type", "text/yaml");
                    res.end(content);
                  });
                }
              },
            },
          ]),
    ],
    server: {
      port: 3000,
    },
  };
});
