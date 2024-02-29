# Meta
[meta]: #meta
- Name: Writable Asset Cache
- Start Date: 2021-06-23
- Author(s): @ekcasey
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes an mechanism by which platforms may optionally provide a writable asset cache to buildpacks, with the goal of reducing build times, especially for the first build of a given image.

# Definitions
[definitions]: #definitions

**Cache**:
**Layer Cache**:
**Asset**:
**Vendored Assets**:
**Asset Package**:
**Asset Cache**:

# Motivation
[motivation]: #motivation

Downloading assets can be slow. If a user of pack or a similar platform has downloaded an asset (e.g. a particular JDK) once, they shouldn't have to wait for it download it again when they build a second app image that requires the same asset.

The way caching currently works in CNB, the layer cache is scoped to a particular image and the cached layers are only restored during a rebuild of that exact image. There are good reasons for this. First of all, on the first build of a new app there is no way of knowing which layers might be helpful to restore. Because layers affect the behavior of subsequent buildpacks and may be directly included in the final app image (launch layers), the potential consequences of deliberate cache poisoning or accidental leakage of unexpected changes between images are high. Buildpacks general cannot predict the diffID of a given layer and therefore have no way to check the integrity of a restored layer. Therefore it is essential that layer caching remains scoped to rebuilds.

However, caching of assets, particularly if they are not restored to a layer, presents much less risk. Buildpacks generally known the hash of the asset they are attempting to download and can therefore check the integrity of a cached asset before using it in a layer.

There may still be security concerns around cache poisoning on a large multi-tenant platform even in the case of known assets. Therefore, the asset cache should be an optional feature that platforms can use at their discretion. For example, `pack` typically runs on personal workstation or in a controlled CI environment. Since the docker daemon is inherently single-tenent anyways, `pack` may wish to provide the same asset cache volume to all builds in a given daemon. A multi-tenant platform like `kpack`, on the other hand, may wish to provide an asset cache per namespace, no asset cache at all, or a configuration option that lets users decide between the previous two options based on their risk tolerance. 

# What it is
[what-it-is]: #what-it-is

## Asset Cache
The environment variable `$CNB_ASSET_CACHE` will denote the location of the asset cache. The layout of the asset cache will mirror that of `/cnb/assets`.

```
$CNB_ASSET_CACHE/<asset-sha256>
```

## Platform API
Platforms that wish to enable asset caching should mount a persistent volume to the container when running either the `builder` or `creator` phases and set `$CNB_ASSET_CACHE` in the container environment, to the path where the volume is mounted.

## Buildpack API
If the platform has provided an asset cache the lifecycle will set `$CNB_ASSET_CACHE` in the buildpack execution environment.

When downloading an asset, an optimally written buildpack should follow the following flowchart:

![flowchart](https://docs.google.com/drawings/d/1cY91fi9DGSAK9BKO8kcjQSXaNnE-9suk2gDfRgxeHlY/export/png)


# How it Works
[how-it-works]: #how-it-works

## pack

`pack` should create a docker volume to hold the asset cache and attach it to every build performed with that docker daemon

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- Wait and see if this problem gets better when users can make their own offline builders with the asset package feature.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.
