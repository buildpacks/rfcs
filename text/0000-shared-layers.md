# Meta
[meta]: #meta
- Name: Shared cached build layers
- Start Date: 2021-05-21
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC introduces the concept of shared build layers which multiple buildpacks can collaborate on/re-use during build time which are not meant to end up in the final application image and are cacheable. Typical use cases include shared caches for tools like CCache, pip cache etc.

> NOTE: This RFC should be implemented as an atomic change alongside RFC https://github.com/buildpacks/rfcs/pull/155

# Definitions
[definitions]: #definitions

- shared layers: A build-time only layer which can be cached and re-used during builds. This layer is "created" by a specific buildpack but can be used by subsequent buildpacks during the build process. Unlike normal buildpack layers, these layers are not expected to follow the unix directory strcuture and the lifecycle SHOULD NOT modidy variables like `PATH`, `LD_LIBRARY_PATH` etc. with folders present in these layers.
- build layers: Layers from a specific buildpack that are available to subsequent buildpacks during the build process.

# Motivation
[motivation]: #motivation

## Why should we do this?

Currently the spec forbids layer modifictions by buildpacks that don't contribute a specific layer. This is not enforced by the lifecycle and leads to cases where subsequent buildpacks can unknowningly modify layer content as a side-effect of executing binaries provided by a build layer. Such unexpected modifications are also really hard to debug and pin-point the case as it can be really difficult to figure out which commands from subsequent buildpacks are causing them. An RFC was created to make build layers read-only for subsequent buildpacks in [PR#155](https://github.com/buildpacks/rfcs/pull/155)

On the other hand there are valid use cases for build layers that can be used as a collaborative workspace for multiple buildpacks and need to be cached in subsequent runs. This RFC is meant to provide a solution for such situations.


## What use cases does it support?

There are various use cases when you may want a common workspace that multiple buildpacks can collaborate on during the build process and this workspace needs to be cached, hence it can't be a temporary directory.

In such a case a buildpack could create a "shared layer" i.e. subsequent buildpacks can modify its contents and the final state of the layer at the end of the build process is what is exported out.

One example can be a CCache buildpack that sets up CCACHE_DIR environment variable (pointing to a directory in a shared layer), which a CMake buildpack may use for its build cache.

Another example can be a pip cache buildpack that sets up a PIP_CACHE_DIR environment variable (pointing to a directory in a shared layer), which could be used by a [pip-tools](https://github.com/jazzband/pip-tools) buildpack, or a [pipenv](https://pipenv.pypa.io/en/latest/) buildpack to resolve the python dependency tree and generate a requirements.txt and subsequently the pip buildpack could install these requirement using the wheels cached during the dependency resolution.

- What is the expected outcome?

The spec and lifecycle is modified to support the above use cases.

# What it is
[what-it-is]: #what-it-is

This RFC introduces a new top level folder structure called `<shared-layers>` which shall live on the same level as the `<layers>` directory.

The structure would look like - 

```
<shared-layers> (configurable with `CNB_SHARED_LAYERS_DIR`)
└── <escaped-buildpack-id> `CNB_BP_SHARED_LAYERS_DIR`
    ├── <shared-layer>.toml
    └── <shared-layer>
        ├── <usable-directory>
        └── env
```

Each buildpack will be passed an environment variable `CNB_BP_SHARED_LAYERS_DIR` with the location to the shared layers directory for a buildpack. Additionally all the lifecycle binaries that accept `-layers`  would accept a `-shared-layers` with the location for this shared layers directory. Older platform APIs could still utilize this and the lifecycle would default to use `<layers>/@shared` (this should not clash with any valid buildpack ID since `@` is not a valid symbol for buildpack IDs ) sub-directory for shared layers in that case.

The `<shared-layer>.toml` would look like - 

```toml
[types]
  cache = false

[metadata]
# buildpack-specific data
```

The `env` directory would be used to set build time only variables for subsequent buildpacks. It will follow an API similar to [Buildpack ENV API](https://github.com/buildpacks/spec/blob/main/buildpack.md#provided-by-the-buildpacks)


# How it Works
[how-it-works]: #how-it-works

All layers created in the `shared-layers` directory are build layers by default. The `cache` layer flag decides if the layer will be cached for the next run or not. This flag will follow the same semantics as [specified here.](https://github.com/buildpacks/spec/blob/main/buildpack.md#cached-layers). The `<shared-layer>.toml` for each layer will be restored with the same semantics as [specified here.](https://github.com/buildpacks/spec/blob/main/buildpack.md#cached-layers) with the `types` table being omitted during subsequent restores to avoid stale layers.

A `shared-layer` is associated with a specific buildpack that created it and it is expected to be wiped if the associated buildpack is not involved during the build process. The `env` directory is co-located with the `shared-layer` so that the associated environment variables that may point to directories in the `shared-layer` follow the same lifecycle as the `shared-layer` itself.


# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Added maintanence complexity.
- Additional complexity for buildpack authors to account for.

# Alternatives
[alternatives]: #alternatives

Not implement shared layers.

# Prior Art
[prior-art]: #prior-art

Related RFCs - 

- https://github.com/buildpacks/rfcs/pull/155
- https://github.com/buildpacks/rfcs/pull/145

The plan would be that this `<shared-layers>` directory would be relocated alongside the `<layers>` if the proposal at https://github.com/buildpacks/rfcs/pull/145 is accepted.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


# Spec. Changes (OPTIONAL)

As described above.