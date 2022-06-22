# Meta
[meta]: #meta
- Name: Support Dockerfiles
- Start Date: 2021-06-30
- Author(s): sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md), [RFC#167](https://github.com/buildpacks/rfcs/pull/167)
- Depends on: [RFC#172](https://github.com/buildpacks/rfcs/pull/172)

# Summary
[summary]: #summary

This RFC introduces functionality for customizing base images, as an alternative to stackpacks ([RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md)).

# Motivation
[motivation]: #motivation

[RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md) introduces complexity by defining an API that allows buildpacks to modify base images. To avoid this complexity, we could rely on generated Dockerfiles for base image manipulation. This would simplify the original proposal by, e.g., only requiring a copy of the buildpack on the build-time base image.

# What it is
[what-it-is]: #what-it-is

This RFC proposes that we replace stackpacks with dynamically-generated build-time and runtime Dockerfiles that act as pre-build base image extensions.
These extensions would participate in detection and execute before the buildpack build process.

For a given application, a build that uses extensions could be optimized by creating a more narrowly-scoped builder that does not contain extensions.

# How it Works
[how-it-works]: #how-it-works

Note: kaniko, buildah, BuildKit, or the original Docker daemon may be used to apply Dockerfiles at the platform's discretion. The order of operations would be something like the following:
* analyze
* detect
* <new lifecycle phase> run extensions' bin/generate, output Dockerfiles are written to a volume
* <new lifecycle phase OR platform> apply Dockerfiles to run image (could run in parallel with build image extension)
* <new lifecycle phase OR platform> apply Dockerfiles to build image
* restore
* build
* export

### Dynamically-applied Dockerfiles

A builder image may include any number of "extensions" directories in `/cnb/ext/`.

Extensions are similar to buildpacks: they have two executables: `/bin/detect` and `/bin/generate`. The interface for these executables is similar to a buildpack's `/bin/detect` and `/bin/build`.
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

Extensions participate in the buildpack detection process, with the same UID, GID, and interface for `/bin/detect`.
However,
- `/bin/detect` is optional for extensions, and they are assumed to pass detection when it is not present. Just like with buildpacks, a /bin/detect that exits with a 0 exit code passes detection, and fails otherwise.
- If an extension is missing `/bin/detect`, the extension root is treated as a pre-populated output directory (i.e., extensions can include a static build plan).
- Extensions may only output `provides` entries to the build plan. They must not output `requires`.
- Extensions are not included in `order` definitions (e.g., in `builder.toml`); instead, a separate `order-extensions` table should be used. The `order-extensions` table will be prepended to each group in the provided `order` (as if `order-extensions` were a composite buildpack).
- Extensions are always `optional`.

Extensions generate Dockerfiles before the regular buildpack build phase.
To generate these Dockerfiles, the lifecycle executes the extension's `/bin/build` executable with the same UID, GID, and interface as regular buildpacks.
However,
- Extensions `/bin/build` must not write to the app directory.
- Extensions `/bin/build` may be executed in parallel.
- Extensions `<layers>` directory is replaced by an `<output>` directory.
- If an extension is missing `/bin/build`, the extension root is treated as a pre-populated `<output>` directory.

After `/bin/build` executes, the `<output>` directory may contain
- `build.toml`, with the same contents as a normal buildpack's `build.toml`, but
  - With an additional `args` table array with `name` and `value` fields that are provided as build args to `build.Dockerfile` or `Dockerfile`
- `launch.toml`, with the same contents as a normal buildpack's `launch.toml`, but
  - Without the `processes` table array
  - Without the `slices` table array
  - With an additional `args` table array with `name` and `value` fields that are provided as build args to `run.Dockerfile` or `Dockerfile`

- Either `Dockerfile` or either or both of `build.Dockerfile` and `run.Dockerfile`

Support for other instruction formats, e.g., LLB JSON files, could be added in the future.

`build.Dockerfile`, `run.Dockerfile`, and `Dockerfile` target the builder image, runtime base image, or both base images, respectively.

If no Dockerfiles are present, `/bin/build` may still consume build plan entries and add metadata to `build.toml`/`launch.toml`.

Dockerfiles are applied to their corresponding base images after all extensions are executed and before any regular buildpacks are executed.
Dockerfiles are applied in the order determined during buildpack detection. When multiple Dockerfiles are applied, the intermediate image generated from the application of the current Dockerfile will be provided as the `base_image` ARG to the next Dockerfile. Dockerfiles that target the run image (only) may ignore the provided `base_image` (e.g., `FROM some-other-image`). Dockerfiles that change the runtime base image may still use `COPY --from=${base_image}`.

All Dockerfiles are provided with `base_image` and `build_id` args.
The `base_image` arg allows the Dockerfile to reference the original base image.
The `build_id` arg allows the Dockerfile to invalidate the cache after a certain layer and must be defaulted to `0`. The executor of the Dockerfile will provide the `build_id` as a UUID (this eliminates the need to track this variable). 
When the `$build_id` arg is referenced in a `RUN` instruction, all subsequent layers will be rebuilt on the next build (as the value will change).

Build args specified in `build.toml` are provided to `build.Dockerfile` or `Dockerfile` (when applied to the build-time base image).
Build args specified in `launch.toml` are provided to `run.Dockerfile` or `Dockerfile` (when applied to the runtime base image).

A runtime base image may indicate that it preserves ABI compatibility by adding the label `io.buildpacks.rebasable=true`. In the case of builder-specified Dockerfiles, `io.buildpacks.rebasable=false` is set automatically on the base image before a runtime Dockerfile is applied and must be explicitly set to `true` if desired. If multiple Dockerfiles are applied, all must set `io.buildpacks.rebasable=true` for the final value to be `true`. Rebasing an app without this label set to `true` requires passing a new `--force` flag to `pack rebase`.

#### Example: App-specified Dockerfile Extension

This example extension would allow an app to provide runtime and build-time base image extensions as "run.Dockerfile" and "build.Dockerfile."
The app developer can decide whether the extensions are rebasable.

##### `/cnb/ext/com.example.appext/bin/build`
```
#!/bin/sh
[ -f build.Dockerfile ] && cp build.Dockerfile "$1/"
[ -f run.Dockerfile ] && cp run.Dockerfile "$1/"
```

#### Example: RPM Dockerfile Extension (app-based)

This example extension would allow a builder to install RPMs for each language runtime, based on the app directory.

Note: The Dockerfiles referenced must disable rebasing, and build times will be slower compared to buildpack-provided runtimes.

##### `/cnb/ext/com.example.rpmext/bin/build`
```
#!/bin/sh
[ -f Gemfile.lock ] && cp "$CNB_BUILDPACK_DIR/Dockerfile-ruby" "$1/Dockerfile"
[ -f package.json ] && cp "$CNB_BUILDPACK_DIR/Dockerfile-node" "$1/Dockerfile"
```


### Dockerfiles for Base Images

The same Dockerfile format may be used to create new base images or modify existing base images outside of the app build process (e.g., before creating a builder). Any specified labels override existing values.

Dockerfiles that are used to create a base image must create a `/cnb/image/genpkgs` executable that outputs a [CycloneDX](https://cyclonedx.org)-formatted list of packages in the image with PURL IDs when invoked. This executable is executed after all Dockerfiles are applied, and the output replaces the label `io.buildpacks.sbom`. This label doubles as a Software Bill-of-Materials for the base image. In the future, this label will serve as a starting point for the application SBoM.

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

COPY genpkgs /cnb/image/genpkgs
```

`run.Dockerfile` for use with the example `app.run.Dockerfile.out` extension that always installs the latest version of curl:
```
ARG base_image
FROM ${base_image}
ARG build_id=0

RUN echo ${build_id}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```
(note: this Dockerfile disables rebasing, as OS package installation is not rebasable)

`run.Dockerfile` for use with the example `app.run.Dockerfile.out` extension that installs a special package to /opt:
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

- Should `genpkgs` be part of this proposal? Opinion: Yes, otherwise it's difficult to maintain a valid SBoM.
- Should we allow base images to provide build plan entries so that extensions aren't required to satisfy buildpacks? Opinion: Not yet, no-op extension can be used for now.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires extensive changes to all specifications.
