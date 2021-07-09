# Meta
[meta]: #meta
- Name: Remove Stacks & Mixins
- Start Date: 2021-06-30
- Author(s): sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC0069](https://github.com/buildpacks/rfcs/blob/main/text/0069-stack-buildpacks.md), [RFC#167](https://github.com/buildpacks/rfcs/pull/167), many others

# Summary
[summary]: #summary

*NOTE: This proposal is part of a larger initiative to reduce complexity originally outlined in https://github.com/buildpacks/rfcs/pull/167*

This RFC proposes that we remove the "stack" and "mixin" concepts from the project and replace them with existing constructs in the container image ecosystem such as base images, Dockerfiles, and OS packages.

# Motivation
[motivation]: #motivation

The "stack" and "mixin" concepts add unnecessary complexity to the project and make it difficult for new users and contributors to understand how buildpacks work. Compatibility guarantees that are strongly enforced by the stack contract could be replaced with metadata validations and warnings.

# What it is
[what-it-is]: #what-it-is

Summary of changes:
- Replace mixins with a [CycloneDX](https://cyclonedx.org)-formatted list of packages.
- Replace stack metadata (including stack IDs) with canonical OS metadata.

# How it Works
[how-it-works]: #how-it-works

## Base Image Metadata

Instead of a stack ID, runtime and build-time base images are labeled with the following canonicalized metadata:
- OS (e.g., "linux", `$GOOS`)
- Architecture (e.g., "x86_64", `$GOARCH`)
- Distribution (optional) (e.g., "ubuntu", `$ID`)
- Version (optional) (e.g., "18.04", `$VERSION_ID`)

For Linux-based images, each field should be canonicalized against values specified in `/etc/os-release` (`$ID` and `$VERSION_ID`).

The `stacks` list in `buildpack.toml` is replaced by a `platforms` list, where each entry corresponds to a different buildpack image that is exported into a [manifest index](https://github.com/opencontainers/image-spec/blob/master/image-index.md). Each entry may contain multiple valid values for Distribution and/or Version, but only a single OS and Architecture. Each entry may also contain a list of package names (as PURL URLs without versions or qualifiers) that specify detect-time and build-time (but not runtime) OS package dependencies. Packages may be specified for all Versions of a distribution, or for a specific Version. Buildpacks may express **runtime** OS package dependencies during detection (see "Runtime Base Image Requirements" below).

App image builds fail if the build image and selected run image have mismatched metadata. We may introduce flags or additional labels to skip this validation (e.g., for cross-compilation or minimal runtime base images). An image without a specified Distribution is compatible with images specifying any Distribution. An image specifying a Distribution without a Version is compatible with images specifying any Versions of that Distribution.

When an app image is rebased, `pack rebase` will fail if the new run image and previous run image have mismatched metadata. This check may be skipped for Distribution and Version by passing a new `--force` flag to `pack rebase`.

#### Example: buildpack.toml `platforms` table

```toml
[[platforms]]
os = "linux"
arch = "x86_64"
[[platforms.distros]]
name = "ubuntu"
[[platforms.distros.versions]]
version = "18.04"
packages = ["pkg:deb/ubuntu/curl"]
[[platforms.distros.versions]]
version = "20.04"
packages = ["pkg:deb/ubuntu/curl2"]

[[platforms]]
os = "linux"
arch = "x86_64"
[[platforms.distros]]
name = "ubuntu"
packages = ["pkg:deb/ubuntu/curl"]
[[platforms.distros.versions]]
version = "14.04"
[[platforms.distros.versions]]
version = "16.04"
```

## Mixins

The mixins label on each base image is replaced by a layer in each base image containing a single file consisting of a [CycloneDX](https://cyclonedx.org)-formatted list of packages. Each package entry has a [PURL](https://github.com/package-url/purl-spec)-formatted ID that uniquely identifies the package.

### Validations

Buildpack base image metadata and packages specified in `buildpack.toml`'s `platforms` list are validated against the runtime and build-time base images.

Runtime and build-time base image packages are no longer validated against each other.

When an app image is rebased, `pack rebase` will fail if packages are removed from the new runtime base image. This check may be skipped by passing a new `--force` flag to `pack rebase`.

## Runtime Base Image Requirements

Buildpacks may specify a list of package names (as PURL URLs without versions or qualifiers) in a `packages` table in the build plan. The build will fail if these packages are not present in the runtime base image.

# Drawbacks
[drawbacks]: #drawbacks

- Involves breaking changes.

# Alternatives
[alternatives]: #alternatives

- Keep stacks.
- Make the above changes but keep some existing terminology: stacks, build-image, run-image.
- Continue to allow for static definition of runtime package requirements in `buildpack.toml`.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should packages be determined during the detect or build phase? Opinion: detect phase, so that (in a later RFC), a runtime base image's app-specified Dockerfiles may by applied in parallel to the buildpack build process.
- How will migration work? Can we make new base images compatible with older buildpacks? Can we make newer buildpacks compatible with older stacks?
# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires extensive changes to all specifications.
