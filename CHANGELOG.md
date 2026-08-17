# Changelog

Every entry comes from a commit subject. Versions are not written by hand:
`.github/versioning/bump.py` compares the public surface of each component and
decides what the change is worth.

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
