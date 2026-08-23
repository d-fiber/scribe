# Changelog

Every entry comes from a commit subject. Versions are not written by hand:
`.github/versioning/bump.py` compares the public surface of each component and
decides what the change is worth.

## 6.0.0 (2026-08-23)

Component versions: @scribe/core 3.0.0, @dependencies/core 0.1.12

### Breaking

- bring alchemy up to 2.1.23 and write what it publishes (96ed0199)

## 5.0.0 (2026-08-22)

Component versions: @scribe/core 2.0.3

### Breaking

- answer on one domain, named in config.yaml (c710a4cb)

### Documentation

- say what scribe is at the root of the repository (073132dc)

### Tooling

- run the formatter over what it had not seen (01139f56)

## 4.0.0 (2026-08-21)

Component versions: @scribe/core 2.0.2, @dependencies/core 0.1.11

### Breaking

- bring the builder up to 2.0.0, without its language half (13bff05a)
- take foundation in with the layout every package has to have (e04223c8)

### Documentation

- drop the security policy, which no repository here carries (4cac13b5)

## 3.0.1 (2026-08-21)

Component versions: @scribe/core 2.0.1

### Added

- take alchemy into the checkout, where the framework reads it (ad433bf0)

### Changed

- read the vocabulary from alchemy instead of holding a copy (f3209403)

## 3.0.0 (2026-08-21)

Component versions: @scribe/core 2.0.0, @dependencies/core 0.1.10, protocol 2.0.2, @scribe/sdk 0.1.6

### Breaking

- take the packages and the builder into host/pkg (df5ff937)
- put scribe under the Mozilla Public License 2.0 (0f0b57b0)
- put the tools in tools/, without a platform in the path (a1546a10)
- move auth out of dependencies and into its own package (edf6b636)
- serve dynamic links and remote configs from packages (706affae)
- key a rate limit on its caller, from foundation (91c120d4)
- move the searcher module out to the search package (6d199372)
- declare realtime by channel and storage by visibility (47a8980b)

### Added

- install scribedev alongside the tools scribe builds (98eba670)
- start the trigger runner with the server (17b927ea)

### Changed

- regenerate the stubs where their sources now sit (a06cb12c)

### Tooling

- exempt the address human commits are signed with (54b2474c)
- replace the sdk CLI with scripts the repo carries (3f6aac4c)

## 2.0.2 (2026-08-18)

Component versions: @scribe/core 1.0.2, @dependencies/core 0.1.9

### Fixed

- provision the JWT claims helper the policies read (b57731d1)

### Security

- drop the development seed and the real accounts in it (3aaa8c13)

### Changed

- let a module declare what waits on it, and drop the manifests (8e372dc3)
- hand the primitive SQL to the mandatory package (3610e273)

### Tests

- render the ops fragments before the end-to-end stack starts (ea04fac3)

## 2.0.1 (2026-08-18)

Component versions: @scribe/core 1.0.1, @dependencies/core 0.1.8, @scribe/sdk 0.1.5

### Added

- build the functions image instead of pulling it (646e27a7)

### Changed

- move realtime and storage into packages of their own (c0f3016d)
- let vpn hold its pending token with auth's (b3391026)
- drop the connection pooler (3b9dcfe2)
- drop the observability module and its log pipeline (4a5d48a2)
- keep in the base stack only what the framework starts (d50e007f)
- send every outgoing request through the client, not fetch (e620e383)
- read Redis, the settings and the harnesses from foundation (10ee2a89)

### Tests

- add the tasks that bring the e2e stack up and run it (3a5604a1)

## 2.0.0 (2026-08-18)

Component versions: @scribe/core 1.0.0, @dependencies/core 0.1.7, @scribe/sdk 0.1.4

### Breaking

- declare the foundation engines by construction (3a7f04d0)
- hand the redis, nats and rest containers to foundation (451d5d82)
- consume foundation as a named deno package (d3ad6e77)
- move the cache, queue, cron and hook to foundation (a76a9e72)
- read the PostgREST engine from the foundation package (3340ee1d)
- let a module wire itself instead of naming it in the boot (4af8c6a2)
- serve the project's nodes, and no endpoints of our own (0f43ae73)

### Performance

- read a page of search previews in a single round trip (3b93a8a4)

### Changed

- read the PostgREST engine from the foundation package (ebf5f4b7)
- derive what the host does not serve instead of listing it (d25a6661)

### Tooling

- move the packages pointer to the body annotation fix (c2b1843a)
- move the packages pointer to the http client (70b750ec)
- move the packages pointer to the hook and cron changes (f66e9da4)
- move the packages pointer to the queue retry change (7adc0e0a)
- check out the packages submodule with its own key (4dc8af6e)
- drop the empty snippets placeholder (c29212ac)

## 1.0.1 (2026-08-17)

Component versions: @scribe/core 0.1.7, @scribe/sdk 0.1.3

### Added

- send a failed response's body with the entry that describes it (ed4d22ca)

### Tooling

- mirror the versions the SDK announces from the files that own them (a1c64309)

## 1.0.0 (2026-08-17)

Component versions: @scribe/core 0.1.6, @dependencies/core 0.1.6, protocol 2.0.1, @scribe/sdk 0.1.2

### Breaking

- make a _log.ts the only place logs go (cd778a85)

### Added

- hand the server the log sinks the routes table exports (9ca76774)
- let a log sink read its entries one by one or by the block (c5740030)
- route each node's log entries to the sink it declared (ffb51ae7)
- let a project take its own logs through a _log.ts (72281453)
- carry the node and the sink declarations on the protocol (e5a4e356)

### Fixed

- type the two log timers the way setTimeout answers (553fc9fa)
- drop the log entry import log routing no longer uses (e190f5e9)
- size the in-flight body budget on the api container (264214b1)
- take the pooler pool sizes from the sizing (1fd8eb9a)

### Performance

- answer a repeated bearer token from the process (695726ae)
- stop the request log costing a write and a publish per request (25fa98d4)
- compress what caddy serves on the three domains (9380a0c0)

### Changed

- gather every rendered file under templates/ (b66ca672)

### Tests

- pin the log dispatch path a foreign SDK must serve (0f2561fa)

## 0.1.7 (2026-08-17)

Component versions: @scribe/core 0.1.5, @dependencies/core 0.1.5

### Added

- declare what a service costs where the service lives (25a25e3f)

### Fixed

- drop the container name a replicated service cannot hold (10805598)

### Changed

- write everything in the source in English (201a4e2d)
- name the framework's init sql root after the framework (1bf67320)

## 0.1.6 (2026-08-17)

Component versions: @scribe/core 0.1.4, @dependencies/core 0.1.4

### Fixed

- count every request body against the in-flight budget (6fd51732)
- have each api replica announce its own callback address (fd220c28)

### Security

- keep the caller's credentials out of the worker invocation (1511e4fa)

### Performance

- check access and the rate limit in one round trip (f699ceb9)
- take the crypto and GoTrue off the identity hot path (1e6f23ff)
- import the shared jwt secret as a key once (659771f7)

### Tooling

- move jose from deno.land/x to jsr (92590364)

## 0.1.5 (2026-08-16)

Component versions: @dependencies/core 0.1.3

### Performance

- select only the columns the messaging repositories map (ca7bda8d)
- select only the columns the devops repositories map (67ffb5a6)

## 0.1.4 (2026-08-16)

Component versions: @scribe/core 0.1.3

### Performance

- bound getOne to two rows instead of the whole match set (aebe64a8)

## 0.1.3 (2026-08-16)

Component versions: @scribe/core 0.1.2

### Security

- redact log keys by word instead of by substring (393e7762)
- keep Object.prototype out of the table owner registry (1651edbf)
- quote the literals the worker puts in a PostgREST or group (483c17bf)
- hold a webhook claim for its whole replay window (6bf13d54)

### Performance

- decrypt a repeated device payload once, not once per request (7abcfe75)
- stop rebuilding a URL to read the path and the query (cc552e12)

## 0.1.2 (2026-08-16)

Component versions: @scribe/core 0.1.1, @dependencies/core 0.1.2

### Fixed

- keep the query string across a surface forward (2e331af8)

### Performance

- bound the api heap so the GC runs before the OOM killer (ab66c3c8)
- read the request path without allocating a URL (0b884e9c)
- import jose by subpath instead of through its barrel (46d5462a)
- stop redoing per-request work the edge path cannot change (bf3d932e)

## 0.1.1 (2026-08-16)

Component versions: @dependencies/core 0.1.1, @scribe/sdk 0.1.1

### Fixed

- stop gitignore from swallowing the storage module (032ff74c)

### Security

- put the contributor agreement in force (617a27df)

### Tooling

- track host/deno.lock so CI resolves the same types (b75c28bc)
- keep host on the global cache so react types resolve (78dbabd5)
- use fiberstudio.app as the CLA employer domain (b560af31)
- let the owner bypass the rulesets and fix CODEOWNERS (f55faa27)
- install the npm dependencies before deno lint and check (2e119fc3)
