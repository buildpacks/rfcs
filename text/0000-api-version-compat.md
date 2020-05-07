# Meta
[meta]: #meta
- Name: Lifecycle API version support changes
- Start Date: 2020-04-14
- Author(s): [Emily Casey](https://github.com/ekcasey)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)

# Summary
[summary]: #summary

In order enable smoother migrations and upgrades this RFC proposes the following changes to the API version compatibility rules:

1. When the lifecycle increments an API versions in the `0.x` version line, this shall interpreted as non-breaking
1. The spec may make certain types of "breaking" changes in a `0.x` API version, so long as those changes do not preclude simultaneous lifecycle support for the previous minor or require collaborating buildpacks to implement the same API version.
1. When the lifecycle implments a new `0.x` API minor version, it will treat the usage of features removed between minor spec versions as a deprecated.

# Motivation
[motivation]: #motivation

## Non-Breaking 0.x API Versions
Originally we specified that all minor version increments in the `0.x` line would be interpreted as breaking changes, when applying [compatibility rules](https://github.com/buildpacks/spec/blob/master/buildpack.md#buildpacktoml-toml).
This was the correct decision initially b/c we needed a way to indicate breaking changes before the APIs reached 1.0.
However, this has become annoying over time as it adds considerable friction to the release of non-breaking features. All platforms and buildpacks must explicitly update to support the new APIs before pulling in a new lifecycle, even when a new minor would not break them.
As the community of platform and buildpack authors grows and matures, this pain is magnified.

Now that the APIs have stabilized we can realistically guarantee that we will not make breaking lifecycle changes before the implementation of the 1.0 APIs are released.

## Deprecations
We will allow the spec to remove features in a minor API and interperet this as a deprecated feature in the lifecycle.
Previous we never formalized rules around deprecations. This made sense because all API changes have been breaking.
However, deprecations can aid platform and buldpack as they prepare to perform a major API upgrade.

The lifecycle will support deprecation modes to allow platform/buildpack authors to curate the experience for users
and/or filter for deprecations relevant to their use case.

# What it is
[what-it-is]: #what-it-is

## Spec
The spec will use future `0.x` API release to indicate changes that can be implemented in a non-breaking fashion. These may include:
- purely additive features
- simple flag/file/key renames (the previous usage will be supported but deprecated by the lifecycle)
- removal of features (these will be interpreted as deprecated by the lifecycle)

## Lifecycle
The lifecycle will continue use the [lifecycle descriptor](https://github.com/buildpacks/rfcs/blob/pack-publish-buildpack/text/0011-lifecycle-descriptor.md) 
to indicate the implemented API versions as before. But the assumptions we make about compatibility will change.

## Deprecations
If a feature is removed from the lifecycle's advertised API version but used by a platform or buildpack the lifecycle will print a deprecation warning.
Because platform authors may want to shield end users from deprecation warning caused by the platform's use of deprecated
lifecycle features, the lifecycle will provide the following options to configure deprecation warnings:

All lifecycle binaries will have a deprecation mode, configurable in the following way:
| Flag              | Environment Variable | Default
|-------------------|----------------------|--------
| -deprecation-mode | CNB_DEPRECATION_MODE | all

The allowed values of deprecation mode are as follows:
| Mode      | Behavior
|-----------|---------
| all       | prints all deprecation warnings
| buildpack | prints only buildpack API deprecation warnings
| platform  | prints only platform API deprecation warnings
| none      | silences all deprecation warnings

# How it Works
[how-it-works]: #how-it-works
## Spec
The core team will ensure that no changes are added to a minor spec release that imply incompatibility with the previous minor.

Examples of ALLOWED changes in a minor 0.x API version:
1. the addition of new image labels
1. the addition of a key to an existing label
1. the addition of a key to an existing file
1. rename a file or a key in a file supplied as input
1. rename a flag
1. remove a flag

Example of DISALLOWED changes in a minor API version:
1. changes to the contractual build plan
2. type changes to an existing key in a label or output file

## Lifecycle
The lifecycle will print deprecation warnings according to the rules described above. The lifecycle will
guarantee that all usage that conforms to API `0.n` will continue to work, even when indicating API `0.n+1` is implemented.

## Platforms
Platforms that wish to enforce compatibility should now treat all minor API versions as non-breaking with the exception
of buildpack and platform `0.1` -> `0.2`. These API versions did include breaking changes and will not be changed.

# Drawbacks
[drawbacks]: #drawbacks

The spec and lifecycle now carry the burden of ensuring there are no breaking changes before `1.0`. `1.0` is an important symbolic
milestone and there could be unforseen and compelling reasons to make a breaking change before we are ready to release `1.0` APIs.

# Alternatives
[alternatives]: #alternatives

- Keep doing what we are doing
    - This will continue to cause pain for platform and buildpack authors
- Continue to assume that minor API versions are breaking, but allow the lifecycle to indicate support for multiple versions simultaneously and use this to ease the disruption caused by new APIs 
    - We will likely want to support multiple APIs in the lifecycle eventually to ease the transition to 1.0

# Prior Art
[prior-art]: #prior-art


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Will we allow removal of features in a minor API version in the spec itself post `1.0`?

# Spec. Changes
[spec-changes]: #spec-changes
The compatibility rules described in https://github.com/buildpacks/spec/blob/master/buildpack.md#buildpacktoml-toml will change to remove the special consideration for `0.x` API versions.
