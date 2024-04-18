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

The `report.toml` file created by the lifecycle exporter and rebaser should include the following properties:
- `run-image.image`
- `run-image.mirrors`
- `run-image.reference`
- `run-image.top-layer`

These values are not necessarily known prior to export or rebase they can be critical to a platform rebase process.

# Motivation
[motivation]: #motivation

Platform operators may need a comprehensive understanding of images on their platform in order to make decisions about rebase and image publishing. Run image metadata is likely part of this comprehensive understanding for rebase. It is likely that this data may only be known after an image is created or rebased, and today it is only accessible via reading the image. Therefore, in order to access this metadata, platform operators must query the image.

Querying the docker daemon or querying an image registry is suboptimal and we should make this data more accessible. It is suboptimal because it requires the platform to run an additional service to query the data it just published. If we make this data more accessible, we could potentially reduce image queries (registry calls) calls by a significant factor.

Putting this data into `report.toml` is advantageous over other methods, especially when considering the kubernetes `terminationMessagePath` message [pattern](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#pod-v1-core). In this pattern, the content of `report.toml` can be used as a container's termination message, making this data easily accessible after an image is exported or rebased within a kubernetes container.

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
run-image.image = "run/name:foo"
run-image.reference = "index.docker.io/run/name@sha256:94f85561b0976bf1e2bef6b14de92299ebcd4c8148802cf9b217654651e4f416"
run-image.top-layer = "sha256:83ad2f0b091621ce19357e19d853c8be1b8f4d60d99c281fc2db75e0f56df42a"
run-image.mirrors = ["<mirror1>", "<mirror2>"]
```

#### Image exported to the docker daemon:
```
[image]
tags = ...
digest = ...
image-id = ...
manifest-size = ...
run-image.image = "run/name:foo"
run-image.reference = "5b90f9c0e189"
run-image.top-layer = "sha256:83ad2f0b091621ce19357e19d853c8be1b8f4d60d99c281fc2db75e0f56df42a"
run-image.mirrors = ["<mirror1>", "<mirror2>"]
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

This metadata is written to the [`lifecycle.metadata` label](https://github.com/buildpacks/spec/blob/main/platform.md#iobuildpackslifecyclemetadata-json) and it can be accessed by querying a docker daemon or registry. So we will be writing this data to two outputs.

# Alternatives
[alternatives]: #alternatives

1. Do nothing and continue to require platforms to retrieve this information via alternative means--either querying the docker daemon or registry.
    - Rebase process may remain suboptimal for some platform providers.

2. Write all the metadata labels to `report.toml`.
    - This could break platform operators that are using the `terminationMessagePath` [pattern](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#pod-v1-core). Because some of the metadata includes unbounded arrays, we could explode this report beyond the max size of 4096 bytes.

3. Write another file that contains this metadata (and potentially more metadata).
    - If we consider this approach and take it to the logical conclusion, we should consider writing a sparse image as output. A sparse image would contain all the metadata available, and it would be in a well-known format that other image tools like `crane`, `skopeo`, or `pack` can read.
    - Writing to another file is not as simple as writing to `report.toml`.
      - It increases the complexity of lifecycle exporter & rebaser. 
      - Writing to another file would not give platform operators the advantage of the `terminationMessagePath` [pattern](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#pod-v1-core), because they are likely already reading `report.toml`.

# Prior Art
[prior-art]: #prior-art

These values are written to image labels. And they are among values that `pack inspect` returns.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes
[spec-changes]: #spec-changes

The following would be appended to the [`report.toml` spec](https://github.com/buildpacks/spec/blob/main/platform.md#reporttoml-toml) (this section would be materially identical to the [`lifecycle.metadata` label](https://github.com/buildpacks/spec/blob/main/platform.md#iobuildpackslifecyclemetadata-json)):

> runImage.topLayer MUST contain the uncompressed digest of the top layer of the run-image.
> 
> runImage.reference MUST uniquely identify the run image. It MAY contain one of the following
> - An image ID (the digest of the uncompressed config blob)
> - A digest reference to a manifest stored in an OCI registry
>
> runImage.image and runImage.mirrors MUST be resolved from run.toml from the given <run-image>

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
