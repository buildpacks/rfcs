# Meta
[meta]: #meta
- Name: Application Mixins
- Start Date: 2020-06-22
- Author(s): [Joe Kutner](https://github.com/jkutner/)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for allowing application developers (buildpack users) to specify mixins that will be dynamically included with their build and run images. In this way, users can include custom system packages (and other libraries) with their applications.

# Motivation
[motivation]: #motivation

Mixins already allow buildpack authors to create buildpacks that depend on an extended set of OS packages without affecting build time, but it's common for application code to depend on OS packages too. But allowing buildpacks to arbitrarily install OS packages during build would drastically increase build time, especially when CNB tooling is used to build or rebase many apps with similar package requirements.

For that reason, this proposal defines a mechanism to implement dynamic installation of mixins at build time while minimizing the performance impact. This is accomplished by allowing stack images to satisfy mixin requires statically and/or reject dynamic mixin installation early in the build process.

# What it is
[what-it-is]: #what-it-is

- *mixin* - a named set of additions to a stack that can be used to make additive changes to the contract.
- *application developer* - a person who is using buildpacks to transform their application code into an OCI image
- *stack buildpack* - a type of buildpack that runs against the stack image(s) instead of an app. Among other things, it can provide mixins.

An application developer may specify a list of mixins in their application's `project.toml` file like this:

```toml
[build]
mixins = [ "<mixin name>" ]
```

When a command like `pack build` is run, the list of mixins will be processed before buildpacks are run. For each mixin name, the following will happen:

* If the mixin name is prefixed with `build:` (as per [RFC-0006](https://github.com/buildpacks/rfcs/blob/main/text/0006-stage-specific-mixins.md)) the mixin will be dynamically added to the build image.
* If the mixin name is prefixed with `run:` (as per [RFC-0006](https://github.com/buildpacks/rfcs/blob/main/text/0006-stage-specific-mixins.md)) the mixin will be dynamically added to the run image.
* If the mixin name does not have a prefix it will be dynamically added to both the build and run stack images.

# How it Works
[how-it-works]: #how-it-works

When a list of mixins are required by buildpacks via the build plan and the build phase starts:

1. The lifecycle will compare the list of mixins to those provided by the stack using the `io.buildpacks.stack.mixins` label.
1. If all mixin names are provided by the stack, no further action is required.
1. If any requested mixin is not provided by the stack, the lifecycle will run the detect phase for all stackpacks defined in the builder.
1. The lifecycle will compare the mixins added to the build plan to see if they match they required mixins.
1. If at least one stackpack passes detect and provides the required mixin(s), the lifecycle will execute the stackpack build phase for all passing stackpack(s). If no stackpacks pass detect, or no stackpacks provide the required mixin, the build will fail with a message that describes the mixins that could not be provided.
1. During the lifecycle's build phase, the stackpacks that passed detection will run against the build and run images accordingly (see details below). All stackpacks will be run before the user's buildpacks.

## Stack Buildpacks

The complete details of a Stack buildpack are described in [another RFC proposal](https://github.com/buildpacks/rfcs/pull/111).

## Rebasing an App

Before a launch image is rebased, the platform must re-run the any stackpacks that were used to build the launch image against the new run-image. Then, the rebase operation can be performed as normal, while including the stackpack layers as part of the stack. This will be made possible by including the stackpack in the run-image, but because the stackpack detect phase is not run, the operation does not need access to the application source.

## Example: ffmpeg

The `project.toml` for an app that requires the `ffmpeg` package might look like this:

```toml
[project]
id = "example/image-app"
name = "My Image App"
version = "1.0.0"

[build]
mixins = [ "ffmpeg" ]
```

## Example: libpq

The `project.toml` for an app that requires the `libpq` package might look like this:

```toml
[project]
id = "example/database-app"
name = "My Database App"
version = "1.0.0"

[build]
mixins = [ "build:libpq-dev", "run:libpq" ]
```

# Drawbacks
[drawbacks]: #drawbacks

- Installing a mixin a build-time means that the `rebase` must also update the provided mixin. In this way, `rebase` becomes an operation that _may_ do more than edit JSON on a registry. It must also re-run a stack buildpack.

# Alternatives
[alternatives]: #alternatives

- [Add root buildpack as interface for app image extension RFC](https://github.com/buildpacks/rfcs/pull/77)
- [App Image Extensions (OS packages)](https://github.com/buildpacks/rfcs/pull/23)
- [Root Buildpacks](https://github.com/buildpacks/rfcs/blob/root-buildpacks/text/0000-root-buildpacks.md): Allow application developers to use root buildpacks in `project.toml`. This would have significant performance implications, and creates a "foot gun" in which end users could build images they are not able to maintain. For this reason, we are holding off on a generic root buildpack feature.

# Prior Art
[prior-art]: #prior-art

- [RFC-0006: Stage specific mixins](https://github.com/buildpacks/rfcs/blob/main/text/0006-stage-specific-mixins.md)
- [Heroku Apt Buildpack](https://github.com/heroku/heroku-buildpack-apt/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should stackpacks be able to define per-stack mixins?
    - We could support a top-level `mixins` array, and allow refinements under `[[stacks]] mixins`. If we do this, we need to distinguish between provided and required mixins (at least under `[[stacks]]`).
    - If buildpacks can require mixins from `bin/detect`, the stackpack could use this mechanism to require per-stack mixins.
- Should we use regex to match mixins?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes


## project.toml (TOML)

```
[[build]]
mixins = [ "<mixin name>" ]
```

Where:

* `mixins` - a named set of additions to a stack that can be used to make additive changes to the contract.
