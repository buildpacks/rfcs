# Meta 
[meta]: #meta
- Name: Buildpack Distribution Specification
- Start Date: 2019-04-12
- CNB Pull Requests: (spec PR to follow)
- CNB Issues: (lifecycle issues to follow)


# Motivation
[motivation]: #motivation

This proposal enables both decentralized, manual distribution of buildpacks from Docker registries as well as automatic distribution of buildpacks from a centralized buildpack registry.
It allows individual buildpacks to be distributed via a Docker registry, and it makes dynamic assembly of builders on a Docker registry efficient.
It provides a developer-friendly interface that abstracts away complex buildpack configurations.

# What it is
[what-it-is]: #what-it-is

This RFC proposes an official way to distribute buildpacks that conform to the CNB buildpack v3 specification.
Changes would consist of a new Buildpack Distribution specification, modifications to the lifecycle builder, and modifications to the pack CLI.

It affects all personas that interact with buildpacks.

# How it Works
[how-it-works]: #how-it-works

## Overview of Changes

- The `order.toml` and `buildpack.toml` files are merged into `buildpack.toml`.
- `buildpack.toml` can contain multiple buildpacks.
- A buildpack inside of `buildpack.toml` is either:
  a. a single buildpack implementation specified by a `path` field or
  b. an ordering of other buildpack IDs/versions
- Every buildpack inside `buildpack.toml` must have an ID and version.
- Multiple buildpack implementations can be defined in `buildpack.toml`, so buildpacks can share files/code.
- A buildpackage is a collection of buildpack repositories with `buildpack.toml` files.
- A buildpackage can have a default buildpack.
- Labels are removed from the specification.
- The lifecycle moves into `/cnb/lifecycle/`.

## Buildpack Blob Format

A buildpack blob is a tgz containing a `buildpack.toml`, which is a configuration file defined in the CNB buildpack specification.
Example format:

```toml
[[buildpacks]]
id = "io.buildpacks.nodejs"
name = "Node.js Buildpack"
version = "0.0.9"
[[buildpacks.order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.7" },
]

[[buildpacks]]
id = "io.buildpacks.npm"
name = "NPM Buildpack"
version = "0.0.7"
path = "./npm-cnb/"
[buildpacks.metadata]
# ...
[[buildpacks.stacks]]
id = "io.buildpacks.stacks.bionic"

[[buildpacks]]
id = "io.buildpacks.node"
name = "Node Engine Buildpack"
version = "0.0.5"
path = "./node-cnb/"
[buildpacks.metadata]
# ...
[[buildpacks.stacks]]
id = "io.buildpacks.stacks.bionic"

```

Each `path` must reference a valid buildpack implementation.
However, buildpacks defined in `[[buildpacks.order]]` do not need to be included in the buildpack blob.

So that a buildpack can identify its corresponding entry in `buildpack.toml`, the buildpack ID is set during the detection and build phases in `$BP_ID`.

## Buildpackage Format

A buildpackage may exist as an OCI image on an image registry, an OCI image in a Docker daemon, or a `.cnb` file.

A `.cnb` file is an uncompressed tar archive containing an OCI image. Its file name should end in `.cnb`.

### Layer Blob

Each FS layer blob in the image contains a single buildpack blob tgz and at least one symlink.
A symlink should be created for each buildpack version that the blob is assembled to support.

```
/cnb/blobs/<sha256 checksum of buildpack blob tgz>/
/cnb/by-id/<buildpack ID1>/<buildpack version> -> /cnb/blobs/<sha256 checksum of blob tgz>/
/cnb/by-id/<buildpack ID2>/<buildpack version> -> /cnb/blobs/<sha256 checksum of blob tgz>/
...
```

Example:

```
/cnb/blobs/bc4c24181ed3ce6666444deeb95e1f61940bffee70dd13972beb331f5d111e9b/
/cnb/by-id/io.buildpacks.nodejs/0.0.9 -> /cnb/blobs/bc4c24181ed3ce6666444deeb95e1f61940bffee70dd13972beb331f5d111e9b/
/cnb/by-id/io.buildpacks.npm/0.0.7 -> /cnb/blobs/bc4c24181ed3ce6666444deeb95e1f61940bffee70dd13972beb331f5d111e9b/
/cnb/by-id/io.buildpacks.node/0.0.5 -> /cnb/blobs/bc4c24181ed3ce6666444deeb95e1f61940bffee70dd13972beb331f5d111e9b/
```

## Buildpackage Metadata

A buildpack ID, buildpack version, and at least one stack must be provided in the OCI image metadata.

Label: `io.buildpacks.cnb.metadata`
```json
{
  "id": "io.buildpacks.nodejs",
  "version": "0.0.9",
  "stacks": [
    {
      "id": "io.buildpacks.stacks.bionic",
      "mixins": ["build:git"]
    }
  ]
}
```

The buildpack ID and version must match a buildpack provided by a layer blob.
For each listed stack, all associated buildpacks must be a candidate for detection when the specified buildpack ID and version are selected.

For a buildpackage to be valid, each entry in `buildpack.toml` must have all listed stacks.
Each stack ID should only be present once, and the `mixins` list should enumerate all the required mixins for that stack to support all included buildpacks.

Fewer stack entries as well as additional mixins for a stack entry may be specified to restrict builders that are created from the buildpackage.

### Execution Order

During detection, a buildpack ID or list of buildpack IDs is resolved into individual buildpack implementation that include a `path` field.

First, the detector determines the user's choice of buildpack IDs or builder's order definition.

Next, the 2-D ordering of buildpacks is derived as follows:

Where:
- O and P are buildpacks IDs referencing buildpacks that compose other buildpack IDs.
- A through H are buildpack IDs referencing executable buildpacks. 

Given:

<img src="http://tex.s2cms.ru/svg/%0AO%20%3D%0A%5Cbegin%7Bbmatrix%7D%0AA%2C%20%26%20B%20%5C%5C%0AC%2C%20%26%20D%0A%5Cend%7Bbmatrix%7D%0A" alt="
O =
\begin{bmatrix}
A, &amp; B \\
C, &amp; D
\end{bmatrix}
" />

<img src="http://tex.s2cms.ru/svg/%0AP%20%3D%0A%5Cbegin%7Bbmatrix%7D%0AE%2C%20%26%20F%20%5C%5C%0AG%2C%20%26%20H%0A%5Cend%7Bbmatrix%7D%0A" alt="
P =
\begin{bmatrix}
E, &amp; F \\
G, &amp; H
\end{bmatrix}
" />

We propose:

<img src="http://tex.s2cms.ru/svg/%0A%5Cbegin%7Bbmatrix%7D%0AE%2C%20%26%20O%2C%20%26%20F%0A%5Cend%7Bbmatrix%7D%20%3D%20%0A%5Cbegin%7Bbmatrix%7D%0AE%2C%20%26%20A%2C%20%26%20B%2C%20%26%20F%20%5C%5C%0AE%2C%20%26%20C%2C%20%26%20D%2C%20%26%20F%20%5C%5C%0A%5Cend%7Bbmatrix%7D%0A" alt="
\begin{bmatrix}
E, &amp; O, &amp; F
\end{bmatrix} = 
\begin{bmatrix}
E, &amp; A, &amp; B, &amp; F \\
E, &amp; C, &amp; D, &amp; F \\
\end{bmatrix}
" />

<img src="http://tex.s2cms.ru/svg/%0A%5Cbegin%7Bbmatrix%7D%0AO%2C%20%26%20P%0A%5Cend%7Bbmatrix%7D%20%3D%20%0A%5Cbegin%7Bbmatrix%7D%0AA%2C%20%26%20B%2C%20%26%20E%2C%20%26%20F%20%5C%5C%0AA%2C%20%26%20B%2C%20%26%20G%2C%20%26%20H%20%5C%5C%0AC%2C%20%26%20D%2C%20%26%20E%2C%20%26%20F%20%5C%5C%0AC%2C%20%26%20D%2C%20%26%20G%2C%20%26%20H%20%5C%5C%0A%5Cend%7Bbmatrix%7D%0A" alt="
\begin{bmatrix}
O, &amp; P
\end{bmatrix} = 
\begin{bmatrix}
A, &amp; B, &amp; E, &amp; F \\
A, &amp; B, &amp; G, &amp; H \\
C, &amp; D, &amp; E, &amp; F \\
C, &amp; D, &amp; G, &amp; H \\
\end{bmatrix}
" />

Note that buildpack IDs are expanded depth-first in left-to-right order.

If a buildpack entry within a group has the parameter `optional = true`, the a copy of the group without the entry is repeated after the original group. This is functionally equivalent to the current meaning of optional for a single buildpack implementation. The current meaning of optional for a single buildpack implementation will remain unchanged, as it is more performant and results in the same behavior.


## User Interface

### App Developer

`pack build` should accept a list of buildpacks via the `--buildpack` flag.
The flag may be passed multiple times to construct a buildpack group.

The value of each flag must be one of:
- A buildpack ID of a buildpack on the builder, optionally followed by `@` and a version
- A path to a buildpackage on the local filesystem
- A reference to a buildpackage on a Docker registry  

A version must be specified if the version is ambiguous.

### Buildpack Developer

`pack create-package` will package a selection of

- gzip compressed, tar archived buildpack blobs
- other buildpackages
- stack and buildpack metadata

into a `.cnb` file, OCI image in a registry, or OCI image in a Docker daemon.

These properties will be specified in a `package.toml` file. This file is a configuration file for the pack CLI, and is not specified in the buildpack, platform, or distribution specification.

Example `package.toml` for Node.js with just blobs:

```toml
[default]
id = "io.buildpacks.nodejs"
version = "0.0.9"

[[blobs]]
uri = "https://example.com/nodejs.tgz"

[[stacks]]
id = "io.buildpacks.stacks.bionic"
mixins = ["build:git"]
```

Example `package.toml` for Rails with blobs and packages:

```toml
[default]
id = "io.buildpacks.rails"
version = "0.0.3"

[[blobs]]
uri = "https://example.com/rails.tgz"

[[packages]]
ref = "registry.example.com/nodejs:0.0.9"
[[packages]]
ref = "registry.example.com/ruby:0.0.4"

[[stacks]]
id = "io.buildpacks.stacks.bionic"
mixins = ["build:git"]
```

`pack create-builder` will generate a builder image from buildpackages, buildpack blobs, and stack metadata.

These properties will be specified in a `builder.toml` file. This file is a configuration file for the pack CLI, and is not specified in the buildpack, platform, or distribution specification.

```toml
[[blobs]]
uri = "https://example.com/nodejs.tgz"

[[packages]]
ref = "registry.example.com/ruby" 

[[order]]
group = [
   { id = "io.buildpacks.nodejs", version = "0.0.9" },
   { id = "io.buildpacks.ruby", version = "0.1.0" },
]

[stack]
id = "io.buildpacks.stacks.bionic"
mixins = ["build:git"]
build-image = "registry.example.com/build"
run-image = "registry.example.com/run"
run-image-mirrors = ["registry2.example.com/run"]
```

If `order` is not specified, the first buildpackage in `packages` becomes the default buildpack when no buildpacks are specified for `pack build`.

# Unanswered Questions
[questions]: #questions


1. What happens when a resolved ordering of buildpacks has the same ID within a group?
   Suggestion: use first, make non-optional if any others are non-optional.

2. Should we allow any buildpack blobs to be present in a buildpackage, regardless of stack?
   Suggestion: no, we can define a different format for a large repository of buildpack blobs.

3. For simplicity, should builders be restricted to a single buildpackage, no blobs, and no order definition?
   Suggestion: no, the proposed model simplifies the workflow.
   
4. Should we remove symlinks in a buildpackage to buildpacks that don't match a buildpackage stack?
   Suggestion: no, this makes dynamic builder generation difficult.
   
5. Is `package.toml` really necessary?
   Suggestion: it's necessary until we develop a buildpack registry that allows you to download a buildpack based on its ID.
   Once there is a registry, we should deprecate `package.toml` so packages can be generated directly from `buildpack.toml`.
   At that point, we should add a `ref` field to `buildpacks[].order[].group[]` so that registry locations can be overridden.

# Drawbacks
[drawbacks]: #drawbacks

Adding multi-group order definitions together is complex.

# Alternatives
[alternatives]: #alternatives

No competing RFCs are proposed.
