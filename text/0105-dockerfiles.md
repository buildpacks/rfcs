# Meta
[meta]: #meta
- Name: Support Dockerfiles
- Start Date: 2021-06-30
- Author(s): sclevine
- RFC Pull Request: [rfcs#173](https://github.com/buildpacks/rfcs/pull/173)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/lifecycle#890](https://github.com/buildpacks/lifecycle/issues/890), [buildpacks/lifecycle#891](https://github.com/buildpacks/lifecycle/issues/891), [buildpacks/lifecycle#892](https://github.com/buildpacks/lifecycle/issues/892), [buildpacks/lifecycle#893](https://github.com/buildpacks/lifecycle/issues/893), [buildpacks/lifecycle#894](https://github.com/buildpacks/lifecycle/issues/894)
- Supersedes: [RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md), [RFC#167](https://github.com/buildpacks/rfcs/pull/167)
- Depends on: [RFC#172](https://github.com/buildpacks/rfcs/pull/172)

# Summary
[summary]: #summary

This RFC introduces functionality for customizing base images, as an alternative to stackpacks ([RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md)).

# Motivation
[motivation]: #motivation

[RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md) introduces complexity by defining an API that allows buildpacks to modify base images. To avoid this complexity, we could rely on generated Dockerfiles for base image manipulation. This would simplify the original proposal by, e.g., only requiring a copy of the extension on the build-time base image.

# What it is
[what-it-is]: #what-it-is

This RFC proposes that we replace stackpacks with dynamically-generated build-time and runtime Dockerfiles that act as pre-build base image extensions.
These extensions would participate in detection and execute before the buildpack build process.

For a given application, a build that uses extensions could be optimized by creating a more narrowly-scoped builder that does not contain extensions.

# How it Works
[how-it-works]: #how-it-works

Note: kaniko, buildah, BuildKit, or the original Docker daemon may be used to apply Dockerfiles at the platform's discretion. The order of operations would be something like the following:
* `analyze`
* `detect` - after standard detection detect will also run extensions' bin/generate, output Dockerfiles are written to a volume
* `extend` - applies run.Dockerfiles to run image (could run in parallel with builder image extension)
* `extend` - applies build.Dockerfiles to builder image
* `restore`
* `build`
* `export`

When Dockerfiles are used to update the run image, care should be taken to ensure registry access prior to the `build` phase, to avoid long builds that fail due to incorrect credentials.

### Dynamically-applied Dockerfiles

A builder image may include any number of "extensions" directories in `/cnb/extensions/`.

Extensions are similar to buildpacks: they have two executables: `./bin/detect` and `./bin/generate`. The interface for these executables is similar to a buildpack's `./bin/detect` and `./bin/build`.
However, instead of a `buildpack.toml` file, extensions have a `extension.toml` file:
```toml
api = "<buildpack API version>"

[extension]
id = "<extension ID>"
name = "<extension name>"
version = "<extension version>"
homepage = "<extension homepage>"
description = "<extension description>"
keywords = [ "<string>" ]

[[extension.licenses]]
type = "<string>"
uri = "<uri>"
```

Extensions may be packaged and examined similar to buildpacks, but with analogous `pack extension` subcommands.

Other pack CLI commands, such as `pack builder create`, will be extended to include support for extensions.

Unlike buildpacks,
- Extensions must not be included in a meta-buildpacks
- Extensions must not have `order`/`group` definitions in `extension.toml`

Extensions participate in the buildpack detection process, with the same UID, GID, and interface for `./bin/detect`.
However,
- `./bin/detect` is optional for extensions, and they are assumed to pass detection when it is not present. Just like with buildpacks, a `./bin/detect` that exits with a 0 exit code passes detection, and fails otherwise.
- If an extension is missing `./bin/detect`, the extension root `./detect` directory is treated as a pre-populated output directory (i.e., extensions can include a static build plan).
- Extensions may only output `provides` entries to the build plan. They must not output `requires`.
- Extensions are not included in `order` definitions (e.g., in `builder.toml`); instead, a separate `order-extensions` table should be used. The `order-extensions` table will be prepended to each group in the provided `order` (as if `order-extensions` were a composite buildpack).
- Extensions are always `optional`.

Extensions generate Dockerfiles before the regular buildpack build phase.
To generate these Dockerfiles, the lifecycle executes the extension's `./bin/generate` executable with the same UID, GID, and interface as regular buildpacks.
However,
- Extensions `./bin/generate` must not write to the app directory.
- Extensions `<layers>` directory is replaced by an `<output>` directory.
- If an extension is missing `./bin/generate`, the extension root `./generate` directory is treated as a pre-populated `<output>` directory.

After `./bin/generate` executes, the `<output>` directory may contain
- `build.toml`,
  - With an `args` table array with `name` and `value` fields that are provided as build args to `build.Dockerfile`
- `run.toml`,
  - With an `args` table array with `name` and `value` fields that are provided as build args to `run.Dockerfile`
- Either or both of `build.Dockerfile` and `run.Dockerfile`

Support for other instruction formats, e.g., LLB JSON files, could be added in the future.

`build.Dockerfile` and `run.Dockerfile`target the builder image or runtime base image, respectively.

If no Dockerfiles are present, `./bin/generate` may still consume build plan entries. Unlike buildpacks, extensions must consume all entries in the provided plan (they cannot designate any entries as "unmet").

Dockerfiles are applied to their corresponding base images after all extensions are executed and before any regular buildpacks are executed.
Dockerfiles are applied in the order determined during buildpack detection. When multiple Dockerfiles are applied, the intermediate image generated from the application of the current Dockerfile will be provided as the `base_image` ARG to the next Dockerfile. Dockerfiles that target the run image (only) may ignore the provided `base_image` (e.g., `FROM some-other-image`). Dockerfiles that change the runtime base image may still use `COPY --from=${base_image}`.

All Dockerfiles are provided with `base_image` and `build_id` args.
The `base_image` arg allows the Dockerfile to reference the original base image.
The `build_id` arg allows the Dockerfile to invalidate the cache after a certain layer and should be defaulted to `0`. The executor of the Dockerfile will provide the `build_id` as a UUID (this eliminates the need to track this variable).
When the `$build_id` arg is referenced in a `RUN` instruction, all subsequent layers will be rebuilt on the next build (as the value will change).

Build args specified in `build.toml` are provided to `build.Dockerfile` (when applied to the build-time base image).
Build args specified in `run.toml` are provided to `run.Dockerfile` (when applied to the runtime base image).

A runtime base image may indicate that it preserves ABI compatibility by adding the label `io.buildpacks.rebasable=true`. In the case of builder-specified Dockerfiles, `io.buildpacks.rebasable=false` is set automatically on the base image before a runtime Dockerfile is applied and must be explicitly set to `true` if desired. If multiple Dockerfiles are applied, all must set `io.buildpacks.rebasable=true` for the final value to be `true`. Rebasing an app without this label set to `true` requires passing a new `--force` flag to `pack rebase`. When the run image is extended and `io.buildpacks.rebasable=true`, the `extend` phase will communicate to the `export` phase the top layer of the run image (prior to extension) so that the exporter can set the appropriate value of `io.buildpacks.lifecycle.metadata` `runImage.topLayer`.

#### Example: App-specified Dockerfile Extension

This example extension would allow an app to provide runtime and build-time base image extensions as "run.Dockerfile" and "build.Dockerfile."
The app developer can decide whether the extensions are rebasable.

##### `/cnb/ext/com.example.appext/bin/generate`
```
#!/bin/sh
[ -f build.Dockerfile ] && cp build.Dockerfile "$1/"
[ -f run.Dockerfile ] && cp run.Dockerfile "$1/"
```

#### Example: RPM Dockerfile Extension (app-based)

This example extension would allow a builder to install RPMs for each language runtime, based on the app directory.

Note: The Dockerfiles referenced must disable rebasing, and build times will be slower compared to buildpack-provided runtimes.

##### `/cnb/ext/com.example.rpmext/bin/generate`
```
#!/bin/sh
[ -f Gemfile.lock ] && cp "$CNB_BUILDPACK_DIR/Dockerfile-ruby" "$1/build.Dockerfile"
[ -f package.json ] && cp "$CNB_BUILDPACK_DIR/Dockerfile-node" "$1/build.Dockerfile"
```

### Dockerfiles for Base Images

The same Dockerfile format may be used to create new base images or modify existing base images outside of the app build process (e.g., before creating a builder). Any specified labels override existing values.

The project will provide tooling that can be used to scan the extended run image. For more information, see https://github.com/buildpacks/rfcs/pull/195.

### Example Dockerfiles

Dockerfile used to create a runtime base image:

```
ARG base_image
FROM ${base_image}
ARG build_id=0

LABEL io.buildpacks.image.distro=ubuntu
LABEL io.buildpacks.image.version=18.04
LABEL io.buildpacks.rebasable=true

ENV CNB_USER_ID=1234
ENV CNB_GROUP_ID=1235

RUN groupadd cnb --gid ${CNB_GROUP_ID} && \
  useradd --uid ${CNB_USER_ID} --gid ${CNB_GROUP_ID} -m -s /bin/bash cnb

USER ${CNB_USER_ID}:${CNB_GROUP_ID}
```

`run.Dockerfile` that always installs the latest version of curl:
```
ARG base_image
FROM ${base_image}
ARG build_id=0

RUN echo ${build_id}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```
(note: this Dockerfile disables rebasing, as OS package installation is not rebasable)

`run.Dockerfile` that installs a special package to /opt:
```
ARG base_image
FROM ${base_image}
ARG build_id=0

LABEL io.buildpacks.rebasable=true

RUN curl -L https://example.com/mypkg-install | sh # installs to /opt
```
(note: rebasing is explicitly allowed because only a single directory in /opt is created)


# Drawbacks
[drawbacks]: #drawbacks

- Involves breaking changes.

# Alternatives
[alternatives]: #alternatives

- Stackpacks
- Previous versions of this RFC that don't interact with the buildpack API.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should we allow base images to provide build plan entries so that extensions aren't required to satisfy buildpacks? Opinion: Not yet, no-op extension can be used for now.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires extensive changes to all specifications.

To deliver incremental value and gather feedback as we implement this large feature, a phased implementation is proposed:
* Phase 1: run.Dockerfiles can be used to switch the runtime base image
* Phase 2: build.Dockerfiles can be used to extend the build time base image
  * 2a: `pack` applies the build.Dockerfiles
  * 2b: the lifecycle applies the build.Dockerfiles using kaniko
* Phase 3: run.Dockerfiles can be used to extend the runtime base image
  * 3a: `pack` applies the run.Dockerfiles
  * 3b: the lifecycle applies the run.Dockerfiles using kaniko
  
https://github.com/buildpacks/spec/pull/307 and https://github.com/buildpacks/spec/pull/308 describe the spec changes needed for phase 1. https://github.com/buildpacks/spec/pull/298 approximately describes the spec changes needed for all phases.
