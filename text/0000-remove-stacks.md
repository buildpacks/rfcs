# Meta
[meta]: #meta
- Name: Remove Stacks
- Start Date: 2021-06-16
- Author(s): sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md), many others

# Summary
[summary]: #summary

This RFC proposes that we remove the "stack" and "mixin" concepts from the project and replace them with existing constructs in the container image ecosystem such as base images, Dockerfiles, and OS packages. This RFC also introduces additional functionality for customizing base images, as an alternative to stackpacks.

# Motivation
[motivation]: #motivation

The "stack" and "mixin" concepts add unnecessary complexity to the project and make it difficult for new users and contributors to understand how buildpacks work. Compatibility guarantees that are strongly enforced by the stack contract could be replaced with metadata validations and warnings.

Removing these concepts and relying on Dockerfiles for base image generation and manipulation applies buildpacks to the problem that they solve best: managing application runtimes and dependencies.

# What it is
[what-it-is]: #what-it-is

Summary of changes:
- Replace mixins with a CycloneDX-formatted list of packages.
- Replace stackpacks with multi-purpose build-time and run-time Dockerfiles.
- Replace stack metadata (including stack IDs) with canonical OS metadata.
- Allow buildpacks to select a minimal runtime base image during detection.

# How it Works
[how-it-works]: #how-it-works

## Base Image Metadata

Instead of a stack ID, runtime and build-time base images are labeled with the following canonicalized metadata:
- OS (e.g., "linux", `$GOOS`)
- Architecture (e.g., "x86_64", `$GOARCH`)
- Distribution (optional) (e.g., "ubuntu", `$ID`)
- Version (optional) (e.g., "18.04", `$VERSION_ID`)

For Linux-based images, each field should be canonicalized against values specified in `/etc/os-release` (`$ID` and `$VERSION_ID`).

The `stacks` list in `buildpack.toml` is replaced by a `platforms` list, where each entry corresponds to a different buildpack image that is exported into a [manifest index](https://github.com/opencontainers/image-spec/blob/master/image-index.md). Each entry may contain multiple valid values for Distribution and/or Version, but only a single OS and Architecture.

`buildpack.toml` no longer contains OS package information. Buildpacks may express runtime package dependencies during detection (see "Runtime Base Image Selection" below).

App image builds fail if the build image and selected run image have mismatched metadata. We may consider introducing a flag to skip this validation.

When an app image is rebased, `pack rebase` will fail if the new run image and previous run image have mismatched metadata. This check may be skipped for Distribution and Version by passing a new `--force` flag to `pack rebase`.

## Mixins

The mixins label on each base image is replaced by a layer in each base image containing a single file consisting of a CycloneDX-formatted list of packages. Each package entry has a [PURL](https://github.com/package-url/purl-spec)-formatted ID that uniquely identifies the package.

### Validations

Buildpack base image metadata specified in `buildpack.toml`'s `platforms` list are validated against the runtime and build-time base images.

Runtime and build-time base image packages are no longer validated against each other.

When an app image is rebased, `pack rebase` will fail if packages are removed from the new runtime base image. This check may be skipped by passing a new `--force` flag to `pack rebase`.

## Runtime Base Image Selection

Builders may specify an ordered list of runtime base images, where each entry may contain a list of runtime base image mirrors.

Buildpacks may specify a list of package names (as a PURL URL without a version or qualifiers) in a `packages` table in the build plan.

The first runtime base image that contains all required packages is selected. When mirrors are present, the runtime base image mirror matching the app image is always used, including for package queries.

## Dockerfiles

Note: kaniko, BuildKit, and/or the original Docker daemon may be used to apply Dockerfiles at the platform's discretion. 

### App-specified Dockerfiles

A buildpack app may have a build.Dockerfile and/or run.Dockerfile in its app directory. A run.Dockerfile is applied to the selected runtime base image after the detection phase. A build.Dockerfile is applied to the build-time base image before the detection phase.

Both Dockerfiles must accept `base_image` and `build_id` args. The `base_image` arg allows the lifecycle to specify the original base image. The `build_id` arg allows the app developer to bust the cache after a certain layer and must be defaulted to `0`.  

A runtime base image may indicate that it preserves ABI compatibility by adding the label `io.buildpacks.rebasable=true`. Rebasing an app without this label set to `true` requires passing a new `--force` flag to `pack rebase`.

### Platform-specified Dockerfiles

The same Dockerfiles may be used to create new stacks or modify existing stacks outside of the app build process. For both app-specified and stack-modifying Dockerfiles, any specified labels override existing values.

Dockerfiles that are used to create a stack must create a `/cnb/stack/genpkgs` executable that outputs a CycloneDX-formatted list of packages in the image with PURL IDs when invoked. This executable is executed after any run.Dockerfile or build.Dockerfile is applied, and the output replaces the label `io.buildpacks.sbom`. This label doubles as a Software Bill-of-Materials for the base image. In the future, this label will serve as a starting point for the application SBoM.

### Examples

run.Dockerfile used to create a runtime base image:

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

COPY genpkgs /cnb/stack/genpkgs
```

run.Dockerfile present in an app directory that always installs the latest version of curl:
```
ARG base_image
FROM ${base_image}
ARG build_id=0

LABEL io.buildpacks.rebasable=true

RUN echo ${build_id}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

Unsafe run.Dockerfile present in an app directory:
```
ARG base_image
FROM ${base_image}
ARG build_id=0

LABEL io.buildpacks.rebasable=false

RUN curl -L https://example.com/mypkg-install | sh # installs to /opt
```

# Drawbacks
[drawbacks]: #drawbacks

- Involves breaking changes.
- Buildpacks cannot install OS packages directly, only select runtime base images.

# Alternatives
[alternatives]: #alternatives

- Stackpacks
- Keep stacks & mixins, but implement "Dockerfiles"
- Ditch stacks & mixins, but skip "Dockerfiles"

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should we use the build plan to allows buildpacks to specify package requirements? This allows, e.g., a requirement for "python" to be satisfied by either a larger runtime base image or by a buildpack. Opinion: no, too complex and difficult to match package names and plan entry names, e.g., python2.7 vs. python2 vs. python.
- Should packages be determined during the detect or build phase? Opinion: detect phase, so that a runtime base image's app-specified Dockerfiles may by applied in parallel to the buildpack build process.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires extensive changes to all specifications.
