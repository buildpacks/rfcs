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

This RFC proposes that we remove the stack ID concept from the project and replace it with existing constructs in the container image ecosystem such as operating system name, operating system version, and architecture.

This RFC also proposes that we remove the "mixin" concept from the project entirely, eliminating strict validation of all facets of base-image-to-buildpack compatibility in favor of a more optimistic approach.

This proposal prioritizes simplicity and flexibility over the avoidance of all failure scenarios by allowing more potentially successful builds to execute.

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

Instead of a stack ID, runtime and build-time base images must contain the following canonicalized metadata:
- OS (e.g., "linux", `$GOOS`), specified as `os` in the base image `config` 
- Architecture (e.g., "arm", `$GOARCH`), specified as `architecture` in the base image `config`
- Architecture Variant (optional) (e.g., "v6", `$GOARM`), specified as `variant` in the base image `config`
- Distribution (optional) (e.g., "ubuntu", `$ID`), specified as a label `io.buildpacks.distribution.name`
- Version (optional) (e.g., "18.04", `$VERSION_ID`), specified as a label `io.buildpacks.distribution.version`

Additionally, the runtime base may contain the following metadata:
- Target ID (optional) (e.g., "minimal"), specified as a label `io.buildpacks.id`

OS, Architecture, and Architecture Variant must be valid identifiers as defined in the [OCI Image specification](https://github.com/opencontainers/image-spec/blob/main/config.md).

Target ID is an identifier specified on the runtime base image that must be provided to buildpacks as `CNB_TARGET_ID` during the build process.
This allows buildpacks to change their behavior if a run image is selected (e.g., distroless) that has special properties outside of OS, architecture, etc.

For Linux-based images, each field should be canonicalized against values specified in `/etc/os-release` (`$ID` and `$VERSION_ID`).
The `os.version` field in an base image `config` may contain combined distribution and version information, but it is not used by the lifecycle.

For Windows-based images, Distribution should be empty. Version should be the [suggested value of `os.version`](https://github.com/opencontainers/image-spec/blob/main/config.md#properties) in the OCI spec (e.g., `10.0.14393.1066`).

The `stacks` list in `buildpack.toml` is replaced by a `targets` list, where each entry corresponds to a different buildpack image that is exported into a [manifest index](https://github.com/opencontainers/image-spec/blob/master/image-index.md).
Each entry may contain multiple valid values for Distribution and/or Version, but only a single OS, Architecture, and Variant.
If the `targets` list is empty and `/bin/build` is present, a target with `os = "linux"` and `arch = "x86_64"` is assumed by tools reading `buildpack.toml`.
If the `targets` list is empty and `/bin/build.bat` or `/bin/build.exe` is present, a target with `os = "windows"` and `arch = "x86_64"` is assumed by tools reading `buildpack.toml`.

App image builds fail if the build image and selected run image have mismatched metadata. We may introduce flags or additional labels to skip this validation (e.g., for cross-compilation or minimal runtime base images).
An image without a specified Distribution is compatible with images specifying any Distribution.
An image specifying a Distribution without a Version is compatible with images specifying any Versions of that Distribution.

When an app image is rebased, `rebaser` must fail if the new run image and previous run image have mismatched metadata. This check can be skipped for Distribution and Version by passing a new `--force` flag to `rebaser`.

#### Example: buildpack.toml `targets` table

```toml
[[targets]]
os = "linux"
arch = "x86_64"
[[targets.distributions]]
name = "ubuntu"
versions = ["18.04", "20.04"]

[[targets]]
os = "linux"
arch = "x86_64"
[[targets.distributions]]
name = "ubuntu"
versions = ["14.04", "16.04"]

[[targets]]
os = "linux"
arch = "arm"
variant = "v6"
[[targets.distributions]]
name = "ubuntu"
versions = ["14.04", "16.04"]
```

## Runtime Metadata

To allow different runtime base images to be used, and to support cross-compilation in the future, buildpacks may need access to the runtime base image's target metadata.
The following environment variables will be available to buildpacks directly in the build-time environment (not via `/platform/env`):
- `CNB_TARGET_OS`
- `CNB_TARGET_ARCH`
- `CNB_TARGET_VARIANT`
- `CNB_TARGET_DISTRO_NAME`
- `CNB_TARGET_DISTRO_VERSION`
- `CNB_TARGET_ID` (optional ID, if present on runtime base image `io.buildpacks.id` label)

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

Platforms may choose to add additional validation. For example, if an SBoM is available, `pack rebase` may fail if packages are removed from the new runtime base image.
This check may be skipped by passing a new `--force` flag to `pack rebase`.
However, this validation is not enforced by the specification.

### Migration

All existing labels and environment variables for stacks and mixins may be preserved on a base image until all users have migrated to the new format.
These labels will be deprecated (but allowed) for the forseeable future.
If the newly-specified field values are missing, the lifecycle and pack may used existing, standardized stack IDs (i.e., `io.buildpacks.stacks.*`) to determine the values of the missing fields, as long as the lifecycle and pack provide a warning for the user.

# Drawbacks
[drawbacks]: #drawbacks

- Involves breaking changes when existing metadata is removed.
- `CNB_TARGET_*` env vars assume a single target -- may require more breaking changes to support parallel, single-container cross-compilation in the future.

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
