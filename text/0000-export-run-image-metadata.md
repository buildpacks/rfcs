# Meta
[meta]: #meta
- Name: Export Run Image Metadata
- Start Date: 2024-04-11
- Author(s): joeybrown-sf
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The `report.toml` file created by the lifecycle exporter and rebaser should include `run-image.image`, `run-image.reference`, and `run-image.top-layer`. These values can be critical to a platform rebase process.

# Motivation
[motivation]: #motivation

When publishing an image directly to a registry, parsing the [`lifecycle.metadata` label](https://github.com/buildpacks/spec/blob/main/platform.md#iobuildpackslifecyclemetadata-json) is inefficient--it requires a call to the registry after the image is published. Adding these values to `report.toml` lets platforms efficiently access this data after an export or rebase without a call to the registry.

# What it is
[what-it-is]: #what-it-is

These values will be included when the lifecycle exporter/creator/rebaser binary writes `report.toml`.

Here are two examples of `report.toml` content. (Other values are omitted for readability.)

#### Image published to a registry:
```
[image]
tags = ...
digest = ...
image-id = ...
manifest-size = ...

[run-image]
image = "run/name:foo"
reference = "index.docker.io/run/name@sha256:94f85561b0976bf1e2bef6b14de92299ebcd4c8148802cf9b217654651e4f416"
top-layer = "sha256:83ad2f0b091621ce19357e19d853c8be1b8f4d60d99c281fc2db75e0f56df42a"
```

#### Image exported to the docker daemon:
```
[image]
tags = ...
digest = ...
image-id = ...
manifest-size = ...

[run-image]
image = "run/name:foo"
reference = "5b90f9c0e189"
top-layer = "sha256:83ad2f0b091621ce19357e19d853c8be1b8f4d60d99c281fc2db75e0f56df42a"
```

# How it Works
[how-it-works]: #how-it-works

This metadata is readily available when `report.toml` is created, so it will be straight-forward to extend `report.toml`.

# Migration
[migration]: #migration

N/A

This is an additive change to a metadata file and will be backwards compatible.

# Drawbacks
[drawbacks]: #drawbacks

This metadata is written to the [`lifecycle.metadata` label](https://github.com/buildpacks/spec/blob/main/platform.md#iobuildpackslifecyclemetadata-json). It can be accessed by querying the config from docker daemon or registry. So we will be writing this data to two outputs.

# Alternatives
[alternatives]: #alternatives

Do nothing and continue to require platforms to retrieve this information via alternative means--either querying the docker daemon or registry.

Introduce a new output file (`lifecycle-metadata.toml?`) that contains everything in [`lifecycle.metadata` label](https://github.com/buildpacks/spec/blob/main/platform.md#iobuildpackslifecyclemetadata-json).

# Prior Art
[prior-art]: #prior-art

These values are among those that `pack inspect` returns.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes
[spec-changes]: #spec-changes

The following would be appended to the [`report.toml` spec](https://github.com/buildpacks/spec/blob/main/platform.md#reporttoml-toml) (this section would be materially identical to the [`lifecycle.metadata` label](https://github.com/buildpacks/spec/blob/main/platform.md#iobuildpackslifecyclemetadata-json)):

> run-image.top-layer MUST contain the uncompressed digest of the top layer of the run-image.
> 
>run-image.reference MUST uniquely identify the run image. It MAY contain one of the following
> - An image ID (the digest of the uncompressed config blob)
> - A digest reference to a manifest stored in an OCI registry

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->
