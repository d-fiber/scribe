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

import { readBoundedBody } from "@scribe/core/kernel/http/serve/body_reader.ts";
import { ServerResponse } from "@scribe/alchemy/route";
import { pathnameOf, stripPrefix } from "@scribe/core/runtime/http/pathname.ts";
import { rewriteRequest } from "@scribe/core/kernel/http/serve/request_rewrite.ts";
import { admitBody, inflightBodyBytes, releaseBody } from "@scribe/core/kernel/http/serve/body_admission.ts";
import { logger } from "@scribe/core/kernel/observability/logger.ts";
import "@scribe/core/kernel/location/ip_location.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { httpSettings } from "@scribe/core/runtime/support/settings/http.ts";
import type { Hono } from "hono";

const RETRY_AFTER_S = "5";

export function serve(handler: () => Response | Promise<Response>): void {
  Deno.serve({ port: httpSettings.get().port }, async (req, info) => {
    const admission = admitBody(req);
    if (admission === null) return bodyRefused();

    try {
      const bodyBytes = await readBoundedBody(
        req,
        admission.maxBodyBytes,
        admission.declaredBytes,
      );
      if (bodyBytes === null) return ServerResponse.payloadTooLarge();

      return await RequestScope.run(req, bodyBytes, handler, peerOf(info));
    } finally {
      releaseBody(admission);
    }
  });
}

export function forward(app: Hono, subPath: string): Promise<Response> {
  const req = RequestScope.get();
  const bodyBytes = RequestScope.getBodyBytes();

  const rewritten = rewriteRequest(req, bodyBytes, subPath);
  RequestScope.set(rewritten, bodyBytes ?? new Uint8Array(0));

  return Promise.resolve(app.fetch(rewritten));
}

export function serveFunction(app: Hono, name: string): void {
  const root: Hono = logger(app);

  serve(() => {
    const pathname = pathnameOf(RequestScope.get().url);
    return forward(root, stripPrefix(pathname, name));
  });
}

function bodyRefused(): Response {
  console.warn(
    `[serve] body refused, ${inflightBodyBytes()} bytes already in flight`,
  );

  const response = ServerResponse.serviceUnavailable();
  response.headers.set("Retry-After", RETRY_AFTER_S);
  return response;
}

function peerOf(info: Deno.ServeHandlerInfo): string | null {
  return info.remoteAddr.transport === "tcp" ? info.remoteAddr.hostname : null;
}
