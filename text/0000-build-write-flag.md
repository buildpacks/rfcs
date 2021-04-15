# Meta
[meta]: #meta
- Name: Write flag for build layers
- Start Date: 2021-04-15
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes the introduction of a  `build-write` flag in addition to the `build` flag. The idea behind this flag is to expose build layers that are both read-write (if `build-write` is set to `true`) or build layers that are read-only (if `build-write` is set to `false`) for subsequent buildpacks.

# Definitions
[definitions]: #definitions

Build layers: Layers from a specific buildpack that are available to subsequent buildpacks during the build process.
layerize: The process of converting a layer directory to a tarball which will be used to create the final application image during the export phase.

# Motivation
[motivation]: #motivation

## Why should we do this?

Currently the spec forbids layer modifictions by buildpacks that don't contribute a specific layer. This is not enforced by the lifecycle and leads to cases where subsequent buildpacks can unknowningly modify layer content as a side-effect of executing binaries provided by a build layer. Such unexpected modifications are also really hard to debug and pin-point the case as it can be really difficult to figure out which commands from subsequent buildpacks are causing them.

On the other hand there are valid use cases for build layers that can be used as a collaborative workspace for multiple buildpacks and need to be cached in subsequent runs.

## What use cases does it support?

- Allowing buildpacks to explicitly indicate how the layers provided by them should be used and having this be guaranteed by the lifecycle.

### Example use case for read-only build layers

A build process consists of 2 buildpacks - a python buildpack and a pip buildpack

1. Buildpack #1 provides a python binary that can be used by subsequent buildpacks but is also used in the app image
2. Buildpack #2 uses the python binary to invoke pip to provide further dependencies.

Unbeknownst to the buildpack author, python has a side-effect on execution where if it's installation directory is writable, it creates new cache objects or updates existing files. As a result, execution of buildpack #2 causes the content of the layers provided by buildpack #1 to change, causing the final layer imageID to change and hampers layer reproducibility and new layers have to be pushed out to the registry.

This could easily be fixed if buildpack #1 only exposed its build layers as read-only to subsequent buildpacks or if it discarded the modifications made by subsequent buildpacks essentially making it "read-only" in the context of the build process.

### Example use case for read and write build layers

There are various use cases when you may want a common workspace that multiple buildpacks can collaborate on during the build process and this workspace needs to be cached, hence it can be a temporary directory.

In such a case a buildpack could provide a layer that is marked as `build-writable` i.e. subsequent buildpacks can modify its contents and the final state of the layer at the end of the build process is what is exported out.

## What is the expected outcome?

The spec and lifecycle is modified to support the above use cases.

# What it is
[what-it-is]: #what-it-is

New layer types that dictate when the given layer directories are layerized. For layers marked as `build-write` to be `false`, they should be layerized immediately after the buildpack that provided the layer is finished with its build process. This way any modification made by the future buildpacks would be ignore while still making this layer available to future buildpacks.

For layers that are marked as `build-write` as true, they should be layerized at the end of the entire build phase of the lifecycle so any changes made by subsequent buildpacks are present in the final app image.

# How it Works
[how-it-works]: #how-it-works

The lifecycle will have to layerize the layers marked `build-write` as `false` during the `build` phase of the lifecycle instead of the `export` phase.

# Drawbacks
[drawbacks]: #drawbacks

Possibly mixing the concerns of the `build` and the `export` phases.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

We could change the the layer so that it is owned by root or a different user between the build steps of different buildpacks so that subsequent buildpacks cannot modify the layers created by other buildpacks. This would require elevated privileges during the build phase of the lifecycle.


- Why is this proposal the best?

This proposal allows you to achieve the above use cases without changing the expected UID/GID of the layers and without elevated permissions during the build phase.

- What is the impact of not doing this?

We could have unknown layer modifications by buildpacks which is currently a spec violation.

# Prior Art
[prior-art]: #prior-art

TODO

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

The impact this would have on the performance of the export step. The exact details of which parts of the lifecycle build and export phases that need to be changed.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Layer content meteadata TOML - s

```toml
[types]
  launch = false
  build = false
  # New flag
  # If build is set to false, this flag will have no effect.
  # The default is false.
  build-write = false
  cache = false

[metadata]
# buildpack-specific data
```
