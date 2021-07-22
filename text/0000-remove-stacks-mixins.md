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
- Remove mixins
- Replace stack metadata (including stack IDs) with canonical OS metadata.

# How it Works
[how-it-works]: #how-it-works

## Base Image Metadata

Instead of a stack ID, runtime and build-time base images are labeled with the following canonicalized metadata:
- OS (e.g., "linux", `$GOOS`)
- Architecture (e.g., "x86_64", `$GOARCH`)
- Distribution (optional) (e.g., "ubuntu", `$ID`)
- Version (optional) (e.g., "18.04", `$VERSION_ID`)

OS and Architecture must be valid identifiers as defined [here](https://golang.org/doc/install/source#environment).
For Linux-based images, each field should be canonicalized against values specified in `/etc/os-release` (`$ID` and `$VERSION_ID`).

The `stacks` list in `buildpack.toml` is replaced by a `targets` list, where each entry corresponds to a different buildpack image that is exported into a [manifest index](https://github.com/opencontainers/image-spec/blob/master/image-index.md). Each entry may contain multiple valid values for Distribution and/or Version, but only a single OS and Architecture.

App image builds fail if the build image and selected run image have mismatched metadata. We may introduce flags or additional labels to skip this validation (e.g., for cross-compilation or minimal runtime base images). An image without a specified Distribution is compatible with images specifying any Distribution. An image specifying a Distribution without a Version is compatible with images specifying any Versions of that Distribution.

When an app image is rebased, `pack rebase` will fail if the new run image and previous run image have mismatched metadata. This check may be skipped for Distribution and Version by passing a new `--force` flag to `pack rebase`.

#### Example: buildpack.toml `targets` table

```toml
[[targets]]
os = "linux"
arch = "x86_64"
[[targets.distros]]
name = "ubuntu"
versions = ["18.04", "20.04"]

[[targets]]
os = "linux"
arch = "x86_64"
[[targets.distros]]
name = "ubuntu"
versions = ["14.04", "16.04"]
```

## Mixins

Mixins are no longer used. If an SBoM is available, platforms may warn when, e.g., a rebase operation would change the available packages.

### Example: CycloneDX SBoM

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.3",
  "version": 1,
  "components": [
    {
      "type": "library",
      "name": "curl",
      "version": "1.2.3",
      "purl": "pkg:deb/ubuntu/curl@1.2.3"
    },
    {
      "type": "library", 
      "name": "libcurl",
      "version": "4.5.6",
      "purl": "pkg:deb/ubuntu/libcurl@4.5.6"
    },
    ...
  ]
}
```

### Validations

Buildpack base image metadata specified in `buildpack.toml`'s `targets` list are validated against the runtime and build-time base images.

Runtime and build-time base image packages are no longer validated against each other.

If an SBoM is available, `pack rebase` will fail if packages are removed from the new runtime base image.
This check may be skipped by passing a new `--force` flag to `pack rebase`.
However, this validation is not enforced by the specification.

# Drawbacks
[drawbacks]: #drawbacks

- Involves breaking changes.

# Alternatives
[alternatives]: #alternatives

- Keep stacks.
- Make the above changes but keep some existing terminology: stacks, build-image, run-image.
- Continue to allow buildpacks to specify package requirements (e.g., by PURL instead of mixins)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How will migration work? Can we make new base images compatible with older buildpacks? Can we make newer buildpacks compatible with older stacks?
- What should builder.toml (and similar stack-dependent config files) look like? What should assets look like? Note: these could be decided in subsequent subteam RFCs / spec PRs.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires extensive changes to all specifications.
