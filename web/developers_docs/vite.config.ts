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

  // Chaque variante n'embarque que la spec qu'elle affiche : la landing n'en a
  // aucune, une surface a la sienne. Copier les autres alourdit le bundle et
  // publie une API sur le domaine d'une autre.
  const yamlSources = surface
    ? [{ src: path.join(GENERATED_DOCS, surface.spec), rename: surface.spec }]
    : [];

  // La marque du projet, distribuee dans chaque variante. `requireAssets()`
  // echoue en nommant les fichiers manquants : le portail ne se construit pas
  // sur un projet qui n'a pas fourni les siens.
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
