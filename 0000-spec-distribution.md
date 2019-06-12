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
Changes would consist of a new Buildpack Distribution specification, modifications the lifecycle builder, and modifications to the pack CLI.

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

## Buildpack Blob Format

A buildpack blob is a tgz containing a `buildpack.toml`. Example format:

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

[[buildpacks]]
id = "io.buildpacks.node"
name = "Node Engine Buildpack"
version = "0.0.5"
path = "./node-cnb/"
[buildpacks.metadata]
# ...
```

Each `path` must reference a valid buildpack implementation.
However, buildpacks defined in `[[buildpacks.order]]` do not need to be included in the buildpack blob.


## Buildpackage Format

A buildpackage may exist as an OCI image on an image registry, an OCI image in a Docker daemon, or a `.cnb` file.

A `.cnb` file is an uncompressed tar archive containing an OCI image. Its file name should end in `.cnb`.


### Layer Blob

Each FS layer blob in the image contains a single buildpack blob tgz and a series of symlinks.

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

### Default Buildpack

The buildpack contains a single metadata layer that references the default buildpack for the buildpackage.

```
/cnb/package.toml
```

containing:
```
[default]
id = "<buildpack ID>"
version = "<buildpack version>"
```

## CNB Package Metadata

All supported stacks must be provided in the OCI image metadata.
```
Label: io.buildpacks.cnb.metadata
JSON:
{
  "stacks": {
    "id": "io.buildpacks.stacks.bionic",
    "mixins": ["mysql"]
   }
}
```
For a buildpackage to be valid, each entry in `buildpack.toml` must have all listed stacks. Each stack ID should only be present once, and the `mixins` list should enumerate all the required mixins for that stack for all included buildpacks.


### Execution Order

During detection, a buildpack ID or list of buildpack IDs is resolved into individual buildpack implementation that include a `path` field.

First, the detector determines the user's choice of buildpack IDs or selects the default one from `/cnb/package.toml`.

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


## User Interface

### App Developer

`pack build` should accept a list of buildpack IDs via the `--buildpack` flag. 

### Buildpack Developer

`pack create-cnb` will package a selection of

- buildpack blobs (tgz)
- other buildpackages
- a default buildpack ID and version (defaults to last selected buildpackage if present)

into a `.cnb` file, OCI image in a registry, or OCI image in a Docker daemon.

These properties will be specified in a `cnb.toml` file.

Instead of builder.toml, `pack create-builder` will generate a builder image from a buildpackage and stack ID.

# Unanswered Questions
[questions]: #questions

Format needed for cnb.toml.

What happens when a resolved ordering of buildpacks has the same ID within a group?

Suggestion: use first, make non-optional if any others are non-optional.

# Drawbacks
[drawbacks]: #drawbacks

Adding multi-group order definitions together is complex.

# Alternatives
[alternatives]: #alternatives

No competing RFCs are proposed.
