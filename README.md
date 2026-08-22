# scribe

A complete backend you install, not a framework you assemble.

A project built on scribe writes no authentication, no account management, no mail, no file storage,
no search, no realtime, no queue, no cron, no HTTP gateway and no observability. All of it is here
already, wired together, with its SQL schema, its containers and its migrations. The project writes
its own domain, and nothing else.

This is the contract Flutter makes, moved to the backend. You do not build the rendering engine, you
write widgets. Here you do not build the HTTP pipeline, you write endpoints.

| Flutter                                                    | scribe                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| the SDK lives outside the project, shared between projects | this repository is a checkout the project sits next to |
| `pubspec.yaml` names the SDK the project needs             | `config.yaml` names what the project is                |
| `lib/` holds your code, and only yours                     | `lib/` holds your code, and only yours                 |
| `.dart_tool/` holds what is derived, never committed       | `.<project>/` holds what is derived, never committed   |
| `flutter create` writes a project that compiles            | `scribe create` writes a project that compiles         |

## What a project looks like

```
my-project/
  config.yaml     what this project is
  lib/            what this project does
  .my-project/    what the machine derives from the first two
  scribe/         this repository, the version the project runs on
```

`config.yaml` is the source of truth for configuration, the SQL is the source of truth for the
schema, and everything else is derived from those two: the enums, the row and table types, the
relations, the environment accessors, the route table the worker reads, the OpenAPI documents, the
Kong configuration and the Docker compose file. None of it is edited by hand. Every generated file
opens with a line saying so and naming the command that rewrites it.

## What comes mounted

A project mounts the packages it wants and gets nothing else. They live in
[`scribe_packages`](https://github.com/d-fiber/scribe_packages), under `host/pkg/packages/`.

| Package          | What it holds                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `foundation`     | the one a project cannot leave out: the PostgREST engine, the cache, the queue, the cron, the hook, the outbound HTTP client, the rate limiter, the isolate, the trigger runner |
| `auth`           | what an account is, from sign up to device trust: the providers, the sessions, the pending tokens, the bans                                                                     |
| `realtime`       | a row's life, broadcast to the callers a channel lets in                                                                                                                        |
| `storage`        | the objects, the buckets and the derived images                                                                                                                                 |
| `search`         | the full text index, and the way it is asked                                                                                                                                    |
| `dynamic_links`  | the short links, what a declaration decides and what it measures                                                                                                                |
| `remote_configs` | the keys a project names in code, with their default and their lifetime                                                                                                         |
| `audience`       | the named set somebody belongs to, and the right that follows from it                                                                                                           |

The other seven reach `foundation` rather than reaching the host, which is why it is the one that
cannot be left out.

## What runs

The rendered stack is a Docker compose file, sized from `config.yaml`. Caddy terminates TLS, Kong
routes, and three Deno services answer: the API, the functions runtime and the worker. `foundation`
brings Postgres with dbmate and PostgREST, Valkey and NATS. A package that needs a container of its
own brings it when it is mounted, which is how `search` adds OpenSearch and `storage` adds imgproxy.

## The one command

`scribe` writes the project, rewrites everything derived from what it declares, sizes and renders
the stack, keeps the secrets, and moves this checkout up or down a version.

```sh
scribe create my-project
scribe gen
scribe doctor
```

It ships built, in `tools/<platform>/`, put there when the framework was installed:

```sh
sh tools/install.sh
```

## The repositories

| Repository                                                            | What it is                                                                    |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`scribe`](https://github.com/d-fiber/scribe)                         | the framework, this one                                                       |
| [`scribe_packages`](https://github.com/d-fiber/scribe_packages)       | the mountable packages, a submodule under `host/pkg/packages/`                |
| [`scribe_alchemy`](https://github.com/d-fiber/scribe_alchemy)         | the language the framework and its packages are both written in               |
| [`scribe_pkg_builder`](https://github.com/d-fiber/scribe_pkg_builder) | what reads the packages, resolves them and writes the import map and the lock |
| [`scribe_tools`](https://github.com/d-fiber/scribe_tools)             | `scribe`, the CLI a project is worked through                                 |
| [`scribe_dev_tools`](https://github.com/d-fiber/scribe_dev_tools)     | `scribedev`, the CLI the framework is worked on with                          |

## Layout

```
host/core/        the primitive package: contracts, runtime, kernel, test harness
host/alchemy/     the vocabulary a package is written out of
host/pkg/         the builder, and the packages it resolves
host/dependencies/ the modules that are not packages yet
host/boot/        how the process starts, and the two runtimes
host/project/     the fifteen points where a project reaches the framework
host/public/      mail rendering and the public pages
protocol/         the host to worker contract, and its version
sdk/js/ sdk/dart/ what a worker is written against
ops/ templates/   the containers, the gateway, and what `create` writes
web/              the documentation portal
```

## The rules that hold it together

**The direction of dependency does not negotiate.** `lib/` depends on `scribe/`, and `scribe/`
depends on nothing. Removing a project and running `deno check`, `deno lint` and `deno task test`
has to pass. The framework reaches the project through fifteen dynamic imports, each with a defined
fallback, so a project that provides nothing still boots.

**The layers are checked by the machine, not by discipline.** Seven layers, one direction, and a
lint rule in `host/core/.lint/layers.ts` that fails `deno lint` on anything reaching upward. A
second rule gives directories a notion of private that TypeScript does not have: a file or an
identifier prefixed `_` is visible only in its own directory and below.

**A project extends, it never modifies.** There is no `if (project === ...)` anywhere. A project
mounts routers, declares optional extensions, registers hooks and queue runners, adds its columns
with `ALTER TABLE`, and overrides the fallbacks it wants to replace.

**One way to do each thing.** One duration type, one size type, one data access surface, one router
shape, one endpoint shape, three event primitives and never a fourth. When a second way appears it
is deleted, not deprecated.

## Working on it

`CONTRIBUTING.md` says how a change is made and what it has to pass before it is opened.

## Licence

Mozilla Public License 2.0. The terms are in `LICENSE`, and every file carries the notice.
