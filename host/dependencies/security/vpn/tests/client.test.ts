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

import { AdminVpnClient, type Vpn, VpnError } from "@scribe/host/dependencies/security/vpn/mod.ts";
import { installValkeryMock } from "@scribe/foundation/testing/valkery.ts";
import { assert, assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";

const OWNER = "admin-1";
const OTHER = "admin-2";

function peer(overrides: Partial<Vpn> = {}): Vpn {
  return {
    id: crypto.randomUUID(),
    name: OWNER,
    enabled: true,
    address: "10.8.0.2",
    publicKey: "pub",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    latestHandshakeAt: null,
    transferRx: 0,
    transferTx: 0,
    persistentKeepalive: "off",
    allowedIPs: [],
    ...overrides,
  };
}

interface FakeWg {
  peers: Vpn[];
  calls: string[];
  restore(): void;
}

function fakeWgEasy(initial: Vpn[] = []): FakeWg {
  const peers = [...initial];
  const calls: string[] = [];

  const fetchStub = stub(
    globalThis,
    "fetch",
    (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = new URL(typeof input === "string" ? input : input.toString());
      const method = init?.method ?? "GET";
      const path = url.pathname;
      calls.push(`${method} ${path}`);

      if (path === "/api/session") {
        return Promise.resolve(
          new Response(JSON.stringify({ requiresPassword: true }), {
            status: 200,
            headers: { "set-cookie": "connect.sid=abc; Path=/" },
          }),
        );
      }

      if (path === "/api/wireguard/client" && method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify(peers), { status: 200 }),
        );
      }

      if (path === "/api/wireguard/client" && method === "POST") {
        const name = JSON.parse(String(init?.body)).name as string;
        peers.push(peer({ name }));
        return Promise.resolve(new Response("{}", { status: 200 }));
      }

      const match = path.match(/^\/api\/wireguard\/client\/([^/]+)(\/.*)?$/);
      if (match) {
        const [, id, action] = match;
        const index = peers.findIndex((p) => p.id === id);
        if (index === -1) return Promise.resolve(new Response("", { status: 404 }));

        if (method === "DELETE") {
          peers.splice(index, 1);
          return Promise.resolve(new Response("", { status: 200 }));
        }
        if (action === "/disable") {
          peers[index] = { ...peers[index], enabled: false };
          return Promise.resolve(new Response("", { status: 200 }));
        }
        if (action === "/configuration") {
          return Promise.resolve(
            new Response(`[Interface]\nPrivateKey=secret-${id}\n`, { status: 200 }),
          );
        }
      }

      return Promise.resolve(new Response("", { status: 404 }));
    },
  );

  return {
    peers,
    calls,
    restore: () => fetchStub.restore(),
  };
}

function withVpn(
  initial: Vpn[],
  run: (client: AdminVpnClient, wg: FakeWg) => Promise<void>,
): Promise<void> {
  const kv = installValkeryMock();
  const wg = fakeWgEasy(initial);

  return run(new AdminVpnClient(), wg).finally(() => {
    wg.restore();
    kv.restore();
  });
}

Deno.test("getByOwner: resolves the peer by its owner name, not by its id", async () => {
  const mine = peer({ name: OWNER });
  await withVpn([peer({ name: OTHER }), mine], async (vpn) => {
    const found = await vpn.getByOwner(OWNER);

    assert(found.ok, "the peer is named after the admin, its id is wg-easy's own");
    assertEquals(found.data.id, mine.id);
  });
});

Deno.test("getByOwner: an owner with no peer is a clean NotFound", async () => {
  await withVpn([peer({ name: OTHER })], async (vpn) => {
    const found = await vpn.getByOwner(OWNER);

    assert(!found.ok);
    assertEquals(found.error, VpnError.NotFound);
  });
});

Deno.test("getByOwner: the admin id is never mistaken for a peer id", async () => {
  await withVpn([peer({ name: OWNER })], async (vpn) => {
    const byId = await vpn.get(OWNER);

    assert(
      !byId.ok,
      "get(adminId) always missed, which is what made every download mint a brand new peer",
    );
    assert((await vpn.getByOwner(OWNER)).ok);
  });
});

Deno.test("getByOwner: with several peers the most recent one wins", async () => {
  const old = peer({ name: OWNER, createdAt: "2026-01-01T00:00:00.000Z" });
  const recent = peer({ name: OWNER, createdAt: "2026-06-01T00:00:00.000Z" });

  await withVpn([old, recent], async (vpn) => {
    const found = await vpn.getByOwner(OWNER);

    assert(found.ok);
    assertEquals(found.data.id, recent.id);
  });
});

Deno.test("deleteAll: every peer of an owner is revoked, others are untouched", async () => {
  const keep = peer({ name: OTHER });

  await withVpn(
    [peer({ name: OWNER }), peer({ name: OWNER }), keep],
    async (vpn, wg) => {
      const result = await vpn.deleteAll(OWNER);

      assert(result.ok);
      assertEquals(
        wg.peers.map((p) => p.id),
        [keep.id],
        "a departing admin must not keep a single valid tunnel behind",
      );
    },
  );
});

Deno.test("deleteAll: an owner without peers succeeds silently", async () => {
  await withVpn([peer({ name: OTHER })], async (vpn) => {
    assert((await vpn.deleteAll(OWNER)).ok);
  });
});

Deno.test("disableAll: peers are disabled rather than removed", async () => {
  await withVpn([peer({ name: OWNER }), peer({ name: OTHER })], async (vpn, wg) => {
    const result = await vpn.disableAll(OWNER);

    assert(result.ok);
    assertEquals(wg.peers.find((p) => p.name === OWNER)?.enabled, false);
    assertEquals(wg.peers.find((p) => p.name === OTHER)?.enabled, true);
  });
});

Deno.test("configuration: the private key is fetched per peer id", async () => {
  const mine = peer({ name: OWNER });
  await withVpn([mine], async (vpn) => {
    const config = await vpn.configuration(mine.id);

    assert(config.ok);
    assert(config.data.includes(`secret-${mine.id}`));
  });
});

Deno.test("configuration: an unknown peer is NotFound, never a silent empty config", async () => {
  await withVpn([], async (vpn) => {
    const config = await vpn.configuration("does-not-exist");

    assert(!config.ok);
    assertEquals(config.error, VpnError.NotFound);
  });
});
