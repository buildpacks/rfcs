# Meta
[meta]: #meta
- Name: Lifecycle API version support changes
- Start Date: 2020-05-17
- Author(s): [Emily Casey](https://github.com/ekcasey)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpacks/rfcs/blob/pack-publish-buildpack/text/0011-lifecycle-descriptor.md

# Summary
[summary]: #summary

In order enable smoother migrations and upgrades this RFC proposes the following changes to the API version compatibility and support rules:

1. When the lifecycle increments an API versions in the `0.x` version line, this shall be non-breaking
1. The specification itself may remove features in a minor version, these features will be supported but deprecated in the lifecycle
1. The lifecycle may deprecate features in a minor API version but will not remove support unless the 
1. The spec shall introduce removals and net new additions in minor API versions, reserving major increments for breaking changes to existing behavior
1. A lifecycle may advertise, in its descriptor file, support for multiple version lines
1. A lifecycle that supports multiple version lines can be run in multiple "modes" to better support platform/buildpack migration between API version lines
1. A lifecycle will only remove support for an entire version line in a major release.
1. Buildpacks may advertise support for multiple version lines
1. Buildpacks will be told which API the lifecycle is using, so that they can choose to implement modes

# Motivation
[motivation]: #motivation

### Non-breaking 0.x minor version changes
Originally we specified that all minor version increments in the `0.x` line would be interpreted as breaking changes.
This was the correct decision initially b/c we needed a way to indicate breaking changes before the APIs reached 1.0.
However, this has become annoying over time as it adds considerable friction to the release of non-breaking features. All platforms and buildpacks must explicitly update
to support the new APIs before pulling in a new lifecycle, even when a new minor would not break them.
As the community of platform and buildpack authors grows and matures this pain is magnified.

Now that the APIs have stabilized we can realistically guarantee that we will not make breaking changes before the 1.0 APIs are released.

In addition to providing an easier rollout process for non-breaking changes, we must provide a better path forward for
breaking changes. With a larger community we can no longer expect platforms and buildpacks to update in a tight time window.
This is the motivation behind supporting multiple API in a single lifecycle release.

API modes will allow platforms and buildpacks to indicate how they expect to interact with the lifecycle and provide a 
way to strongly test compatibility before support for a deprecated API is removed.


# What it is
[what-it-is]: #what-it-is

## 

### Version Lines
### API Mode
### Deprecation Silencing

# How it Works
[how-it-works]: #how-it-works

## Platform API example
Lifecycle `0.7.4` implements platform API `0.3`. When the specification of platform API `0.4` is finalized lifecycle `0.8.0` will be cut.
It will have the following entry in its descriptor file
```
```
Lifecycle `0.8.0` will interact with a given platform as follows:
1. If a platform uses features present in both 0.3 and 0.4 it will behave identically
2. If a platform uses new features from the 0.4 API it will work
3. If a platform uses features present in 0.3 but not in 0.4 the lifecycle will behave as before but print a deprecation warning

It is the responsibility of the platform to check the lifecycle API version and avoid using 0.4 features with the `0.7.4` lifecycle.

When platform API `1.0` is finalized lifecycle `0.9.0` will be cut.
It will have the following descriptor file
```
```
Lifecycle `0.9.0` will interact with a given platform as follows:
1. If a platform sets `CNB_PLATFORM_API=0` it will behave identically to lifecycle `0.8.0`
1. If a platform sets `CNB_PLATFORM_API=1` and uses features that were deprecated in lifecycle `0.8.0`, the lifecycle will fail
1. If a platform sets `CNB_PLATFORM_API=1` and behavior has changed between `0.4` and `1.0` (example: a label schema has changed) it will behave as specified in the `1.0` API
1. If a platform does not set `CNB_PLATFORM_API` it will behave as if `CNB_PLATFORM_API=1` was set

Support for the older version line will only be removed in a next major version of the lifecycle.
Lifecycle `1.0.0` may have the following descriptor file
```
```
Lifecycle `1.0.0` will interact with a given platform as follows:
 1. If a platform sets `CNB_PLATFORM_API=0` the lifecycle will fail
 1. If a platform sets `CNB_PLATFORM_API=1` and uses features present in API `1.0` it will behave identically to lifecycle `0.9.0`

## Buildpack API example

### Lifecycle Minor Release - Bumps the minor of a supported version line
Lifecycle `0.7.4` implements buildpack API `0.2`. When the specification of platform API `0.4` is finalized lifecycle `0.8.0` will be cut.
It will have the following entry in its descriptor file
```
```
1. The lifecycle shall always set CNB_BUILDPACK_API=0 in the buildpack execution evironment
1. If a buildpack uses features present in both 0.2 and 0.3 the lifecycle will behave identically
2. If a buildpack uses new features from the 0.3 API the lifecycle will work as specified
3. If a buildpacks uses features present in 0.2 but not in 0.3 the lifecycle will behave as before but print a deprecation warning
4. If a buildpack specifies a buildpack API in it's `buildpack.toml` that the lifecycle does not recognize (e.g. 0.4 or 1.0) the lifecycle will error out

### Lifecycle Minor Release - Supports a new buildpack API version line
When buildpack API `1.0` is finalized lifecycle `0.9.0` will be cut.
It will have the following descriptor file
```

```
Lifecycle `0.9.0` will interact with a given buildpack as follows:

#### Older Supported Buildpack API
If a buildpack indicates `0.x` buildpack API in it's `buildpack.toml` the lifecycle will:
1. set `CNB_BUILDPACK_API=0` in the buildpack execution environment
1. behave identically to lifecycle `0.8.0`

#### Newer Supported Buildpack API
If a buildpack indicates `1.0` buildpack API in it's `buildpack.toml` the lifecycle will:
1. set `CNB_BUILDPACK_API=1` in the buildpack execution envionment
1. behave identically to lifecycle `0.8.0`
1. fail if the buildpack uses features that were deprecated in lifecycle `0.8.0`
1. behave as specified in buildpack API `1.0`

#### Multiple Supported Buildpack APIs - select the newest
If a buildpack indicates support for `1.0` AND `0.2` it's buildpack toml, the lifecycle will:
1. set `CNB_BUILDPACK_API=1` in the buildpack execution envionment
1. behave as specified in buildpack API `1.0`
1. fail if the buildpack uses features that were deprecated in lifecycle `0.8.0`

#### Multiple Buildpack APIs, One Unsupported - select the newest supported
If a buildpack indicates support for `2.0`, `1.0`, `0.2` it's buildpack toml, the lifecycle will:
1. set `CNB_BUILDPACK_API=1` in the buildpack execution envionment and behave identically to lifecycle `0.8.0`
1. behave as specified in buildpack API `1.0`
1. fail if the buildpack uses features that were deprecated in lifecycle `0.8.0`

#### Buildpack Groups
If a buildpack group contains multiple buildpacks with differing buildpack api version(s), the lifecycle will:
1. do the best it can
1. if changes between version lines do not affect bp->bp contracts (e.g. the build plan) the lifecycle will follow the rules above for each individual buildpack

##### buildpacks share a common version
1. if changes between version lines do affect bp->bp contracts, the lifecycle will select the newest API version common to all buildpacks in the group

##### buildpacks do not share a common version
1. if changes between version lines do affect bp->bp contracts, and there is no common version, the lifecycle may refuse to run the group. It may print a warning and make a best-effort attempt to run.

### Lifecycle Major Release - Removes support for an older version line
When lifecycle `1.0.0` is cut support for the older version line shall be removed.
The lifecycle will have the following descriptor file
```

```
#### Unsupported Buildpack API
If a buildpack indicates `0.x` buildpack API in it's `buildpack.toml` the lifecycle will:
1. fail

#### Supported Buildpack API
If a buildpack indicates `1.0` buildpack API in it's `buildpack.toml` the lifecycle will:
1. run as specified

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

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
