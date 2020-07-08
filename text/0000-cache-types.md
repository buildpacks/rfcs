# Meta
[meta]: #meta
- Name: Cache Scope
- Start Date: 2020-06-26
- Author(s): [Javier Romero](https://github.com/jromero)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Allow for buildpacks to specify what cache layers can be shared across applications.

# Motivation
[motivation]: #motivation

In order to provide a better experience, platforms such as `pack` could provide a way to share cache across multiple applications. In particular, this is a frequently requested feature ([pack#340](https://github.com/buildpacks/pack/issues/340), [pack#652](https://github.com/buildpacks/pack/issues/652), [slack](https://buildpacks.slack.com/archives/C94UJCNV6/p1588718688412300), [slack](https://buildpacks.slack.com/archives/CD61YAG69/p1586370336098700)) for similar language family apps.

Use Case:
```
Given I build a Java app A
When I build a Java app B
Then I expect similar maven dependencies not to have to be downloaded again
```

In order to solve this use case in a safe manner, the platform needs to know what cache it can share with other applications versus what cache is specific to a single application. This information is primarily known by the buildpacks.

# What it is
[what-it-is]: #what-it-is

Buildpacks will provide a mechanism to denote a cached layer as something that can be shared by specifying a scope of "shared".

- Target persona: buildpack author

There will be two defined scopes: 

- `app` - This cached layer is specific to the application and SHOULD NOT be shared with any other applications.
- `shared` - This cached layer is specific to the buildpack and MAY be shared across multiple applications.

# How it Works
[how-it-works]: #how-it-works

#### Platform Implementation

Platforms can decide how to _share_ the "shared" cached layers based on their specific use cases.

In `pack`, being a local development tool, shared cached layers could be implemented as a single global cache that is shared across all applications. Additional options can be provided to restrict or otherwise configure this sharing.

In a different platform, one can foresee that the cache is shared only within a "project" or an "organization".

#### Lifecycle Implementation

1. The lifecycle will provide additional `-shared-cache-dir` and `-shared-cache-image` options where `-cache-dir` and `-cache-image` could be provided.
2. Layers marked as `cache = true` and `cache-scope = "shared"` will be stored in either `-shared-cached-dir` or `-shared-cache-image`.
3. If `-shared-cache-dir` or `-shared-cache-image` are not provided and a buildpack sets a layer to cache with scope `shared`, then it would be cached to the standard cache location (`-cache-dir`/`-cache-image`).

# Drawbacks
[drawbacks]: #drawbacks

- Requires that the buildpack author be conscious about providing this information for optimization purposes.

# Alternatives
[alternatives]: #alternatives

- Generic Read/Write volume mounts (RFC PR [#85](https://github.com/buildpacks/rfcs/pull/85))
    - The buildpack user must know what and where to mount things.
    - Has safety concerns when writing to Linux mounts.
    - Solution violates the spec dependent on use.
    - Solution is specific to `pack`.
    
# Prior Art
[prior-art]: #prior-art

None

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


# Spec. Changes
[spec-changes]: #spec-changes

### Buildpacks Spec

##### [Layer Content Metadata TOML](https://github.com/buildpacks/spec/blob/main/buildpack.md#layer-content-metadata-toml)
```toml
# whether this layer should be available at launch (run-time)
launch = false

# whether this layer should be available to subsequent buildpacks
# type: boolean
build = false

# whether this layer should be cached
# boolean
# type: boolean
cache = false

# type of cache (if `cache = true`)
# type: string
# values: app, shared
# default: app
cache-scope = "app"

[metadata]
# buildpack-specific data
```
