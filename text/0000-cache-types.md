# Meta
[meta]: #meta
- Name: Cache Types
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

Buildpacks will provide a mechanism to denote a cached layer as something that can be shared by associating a "type" to the cache.

- Target persona: buildpack author

There will be two types: 

- `app-specific` - This cache is specific to the application and SHOULD NOT be shared with any other applications.
- `buildpack-specific` - This cache is specific to the buildpack and MAY be shared across multiple applications.

# How it Works
[how-it-works]: #how-it-works

#### Platform Implementation

Provided that there is something that denotes what type of cached layers are available the platform can choose to which scope, if any, they'd like to share the `buildpack-specific` caches.

In `pack`, this could be implemented to limit cache sharing per builder but across applications.

#### Lifecycle Implementation

TODO

# Drawbacks
[drawbacks]: #drawbacks

- Doesn't solve for the possibility of "seeding" a cached layer with data on first run. 
    - Use case: I have `~/.m2` locally and would like to provide that to the build process so that it doesn't have to download all dependencies on first run. 

# Alternatives
[alternatives]: #alternatives

- Generic Read/Write volume mounts (RFC PR [#85](https://github.com/buildpacks/rfcs/pull/85))
    - The buildpack user must know what and where to mount things.
    - Has safety concerns when writting to Linux mounts.
    - Solution violates the spec dependant on use.
    - Solution is specific to `pack`.
    
# Prior Art
[prior-art]: #prior-art

None

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


# Spec. Changes
[spec-changes]: #spec-changes

TODO