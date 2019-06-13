# Meta 
[meta]: #meta
- Name: Contractual Build Plan
- Start Date: 2019-04-12
- CNB Pull Requests: (spec PR to follow)
- CNB Issues: (lifecycle issues to follow)


# Motivation
[motivation]: #motivation

This proposal suggests a new contract for generating the build plan and bill-of-materials that is easy to understand and more straightforward.

While the current build plan contract is superficially simple, buildpacks use currently use it in ways that are occasionally difficult to understand or explain.

For example, some buildpacks "push" dependencies they plan to provide into the build plan, while other buildpacks "pull" dependencies they need from other buildpacks by placing them in the build plan.

Additionally, reading an incremental build plan during the detection phase isn't necessary to accomplish the current use cases for the build plan.

# What it is
[what-it-is]: #what-it-is

This RFC proposes a breaking change to the build plan contract.
Changes would consist of modifications to the buildpack specification and to the lifecycle detector.

It affects buildpack developers who implement modular, interdependent buildpacks.

# How it Works
[how-it-works]: #how-it-works

## Overview of Changes

- `/bin/detect` no longer receives a build plan on stdin.
- In `/bin/detect`, buildpacks contribute two sections to the build plan: `requests` and `provides`
- Every requested dependency must be provided for detection to pass.
- Every provided dependency must be requested for detection to pass.

## Build Plan Contributions during Detection

Example: 
```
[[requests]]
name = "nodejs"
version = "1.x"
[[requests.metadata]]
something = "12"


[[provides]]
name = "nodejs"
```

## Build Plan Output during Build

Example:
```
[[nodejs]]
name = "nodejs"
version = "1.x"
[[nodejs.metadata]]
something = "12"
```

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
