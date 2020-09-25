# Meta
[meta]: #meta
- Name: Layer Origin Metadata
- Start Date: 2020-07-09
- Author(s): pclalv
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpacks/rfcs/pull/63

# Summary
[summary]: #summary

<!-- One paragraph explanation of the feature. -->

Exposing layer origin metadata in `report.toml` will improve layer
traceability and, in turn, build and image traceability.

# Motivation
[motivation]: #motivation

- Layer generation can be influenced by the state of the file system,
  namely by the state of the application directory, other layers, and
  the stack's build image
- Layers aren't traceable, because we can't know enough about the
  state of the file system at the instant that the buildpack build
  executable is invoked (TODO: figure out if there's a less wordy name
  for this)
- Images aren't traceable, because their constituent layers aren't
  traceable
- Layers and images should be traceable
- Exposing layer origin metadata will enable us to know crucial facts
  about the state of the file system at the time that the buildpack
  build executable is invoked

# What it is
[what-it-is]: #what-it-is

## Terminology

- **Layer origin metadata** is the missing piece of the traceability
  puzzle; it includes the ID of the restored version of the layer (if
  applicable), modification date, source version info, and a list of
  the IDs of the layers that were present at layer generation time.
- **Layer ID** is the layer's unique ID, whether on disk or on the
  registry.
- **Traceability** concerns the problem of identifying the inputs to
  an image or layer (compare with **reproducibility**, which concerns
  the problem of producing identical images/layers given identical
  inputs, setting aside the problem of identifying those inputs.)

## Target persona

This feature will be useful for **buildpack authors** and **platform
operators** towards tracing and reproducing images and layers.

## Example

Consider some buildpack `yabba` and some application `foo-api`. Let's
also say that the `yabba` buildpack generates a cacheable build layer
`yabba/build`.

1. I do a build of the `foo-api` as of git SHA aaa000 involving the
   `yabba` buildpack, without using any cache.
2. I do a build of the `foo-api` as of git SHA aaa111 involving the
   `yabba` buildpack, using the cache from the previous build.

I want to account for all of the inputs that were present during the
second build:

1. the version of the `foo-api` application
2. the version of the `yabba` buildpack
3. the version of the stack's build image
4. the version of the `yabba/build` layer that was restored from the
   cache

I can account for all but the last - I neither know that layer's
identity, nor how it was created (the version of the `foo-api`, the
version of the `yabba` buildpack, whatever layers existed at that
time). I cannot identify the second image's inputs - in other words, I
cannot trace the second image.

Now consider that I have access to each image's `report.toml`, and
that the second image's `report.toml` looks something like this:

```toml
[image]
tags = ["index.docker.io/image/name:latest", "index.docker.io/image/name:other-tag"]
digest = "26cca5b0c787"
image-id = "sha256:a9561eb1b190625c9adb5a9513e72c4dedafc1cb2d4c5236c9a6957ec7dfd5a9"

[restored-image]
# Same schema as [image] above, but without tags
digest = "97e47fb9e0a6"
image-id = "sha256:a8d2b367f43398fbabe25d45291451003e529fdd5d50f27437291fe61d637ba1"

[[layers]]
buildpack = "yabba"
name = "build"
on-export = "reused"
digest = "1742affe03b5"
modification-date = "2020-07-09 12:41:35-04:00"
size = 17813
previous-layer-digest = "c54bba046158"

cache = true
launch = false
build = true

[[layers.application-source]]
type = "git"

[[layers.application-source.version]]
sha = "26e8c05b151f57161d64b7a5f844bb04caed0ba3"

[[layers.metadata]]
checksum = "96d06478d425bd0411d34e71376fbd93"

[[lifecycle]]
version = "0.8.0"

[[lifecycle.build-image]]
tags = [...]
digest = ...
image-id = ...

[[lifecycle.run-image]]
tags = [...]
digest = ...
image-id = ...
```

Given such a `report.toml`, I can discover all of the inputs to the
layer. If later I need to reproduced the layer produced by the first
build, I will be able to reference the `report.toml` for the image
designated by `restored-image.digest`. Storing `report.toml` files and
associating them with images will have to be a platform concern, given
that we want to avoid embedding that information in the image itself.

# How it Works
[how-it-works]: #how-it-works

<!-- This is the technical portion of the RFC, where you explain the design -->
<!-- in sufficient detail. -->

<!-- The section should return to the examples given in the previous -->
<!-- section, and explain more fully how the detailed proposal makes those -->
<!-- examples work. -->

The exporter lifecycle phase should populate origin metadata for each
layer, and that information should end up in `report.toml`.

The exporter lifecycle phase knows of the relevant information (the
cache, previous image metadata, project-metadata.toml) and is
responsible for calculating layer digests, so additionally logging
that action taking place shouldn't be too difficult.

To be explicit, this features does not care about intermediate layer
states. We can treat buildpacks as black boxes and leave investigation
of intermediate layer states to buildpack developers.

Layer origin metadata is required or optional, depending on the
platform's caching strategy. Our ability to make guarantees about the
existence of layer origin metadata depennds on the layer caching
strategy: if layers are cached in the registry, then layer origin
metadata should always exist; if layers are cached on disk, then layer
origin metadata may not be available.

# Drawbacks
[drawbacks]: #drawbacks

* This adds complexity to the lifecycle.

# Alternatives
[alternatives]: #alternatives

<!-- - What is the impact of not doing this? -->

There's a big problem right now around traceability, which affects
reproducibility in practice. Given that build reproducibility is a
stated goal, something has to be done. Until something is done,
traceability, and hence reproducibility, is not simple.

<!-- - Why is this proposal the best? -->



<!-- - What other designs have been considered? -->

You can maybe imagine that **a buildpack itself might record all of
its layer origin metadata** and contribute that directly to
`report.toml`. However, closer consideration suggests that **this
should not be the buildpack's responsibility**. Layer origin metadata
concerns the identity of layers at the container runtime level (or at
the registry level), which should be opaque to buildpacks; a buildpack
does not need to know that it's being run in a container.

## Exposing all layer metadata
[expose-all-layer-metadata-recap]: #exposing-all-layer-metadata

Before this RFC, I'd written an [RFC to expose all layer metadata in
the image's labels][expose-all-layer-metadata]. My thinking, at the
time, was that I might write an RFC that could appeal to the CNB
maintainers, for a feature that would allow me to solve my problem for
myself. But, that RFC as-is does not address my problems; for one, it
doesn't link together a buildpack layer X with whatever other
buildpack layers were around when layer X was created. Non-launch
layer metadata is important but it's just one piece of the puzzle. I
think that the ideal solution would involve knowing the identities of
layers present during a buildpack's execution, as that would enable us
to discover that layer's metadata, and that ideally we'd solve this
problem for anyone who ever might have to trace an image.

# Prior Art
[prior-art]: #prior-art

<!-- Discuss prior art, both the good and bad. -->

See [above][expose-all-layer-metadata-recap].

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

## To be resolved before this gets merged

<!-- - What parts of the design do you expect to be resolved before this -->
<!--   gets merged? -->

* Does this affect how `report.toml` should be spec'd?
* How is layer origin metadata stored for layers that are not cached?
* Are there use cases for requiring that layer origin metadata is
  available, or is it merely a nice-to-have?
  * Would users like to be able to enforce that image builds are only
    valid if all relevant layer origin metadata is available?
  * Would users like to use volume caching AND require that all builds
    using that cache have layer origin metadata? One implication of
    this is that if layer origin metadata becomes unavailable, the
    cache cannot be used.
* Whose job is it to identify SCM information: the lifecycle, or the
  platform?

## To be resolved through implementation

<!-- - What parts of the design do you expect to be resolved through -->
<!--   implementation of the feature? -->

* How will the exporter lifecycle phase contribute to `report.toml`?

## Out of scope

<!-- - What related issues do you consider out of scope for this RFC that -->
<!--   could be addressed in the future independently of the solution that -->
<!--   comes out of this RFC? -->

* Should users be able add organization-specific layer origin
  metadata? How would they do so?
* How does any of this relate to volumes mounted by the platform (for
  example, `/platform/env/`)? Such a volume may affect the build, so
  it must be considered an input. However, we have no existing means
  of identifying that volume mount or its contents. How can we get a
  handle on arbitrary volume mounts in a way that enables us to trace
  their participation in builds?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

TODO

<!-- Does this RFC entail any proposed changes to the core specifications -->
<!-- or extensions? If so, please document changes here.  Examples of a -->
<!-- spec. change might be new lifecycle flags, new `buildpack.toml` -->
<!-- fields, new fields in the buildpackage label, etc.  This section is -->
<!-- not intended to be binding, but as discussion of an RFC unfolds, if -->
<!-- spec changes are necessary, they should be documented here. -->

[expose-all-layer-metadata]: https://github.com/buildpacks/rfcs/pull/63
