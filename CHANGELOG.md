# Changelog

Every entry comes from a commit subject. Versions are not written by hand:
`.github/versioning/bump.py` compares the public surface of each component and
decides what the change is worth.

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
