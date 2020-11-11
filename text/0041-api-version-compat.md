# Meta
[meta]: #meta
- Name: Lifecycle API version support changes
- Start Date: 2020-05-14
- Author(s): [Emily Casey](https://github.com/ekcasey)
- RFC Pull Request: [rfcs#79](https://github.com/buildpacks/rfcs/pull/79)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)

# Summary
[summary]: #summary

To enable smoother migrations and upgrades this RFC proposes the following changes to the API version compatibility rules:

1. When the lifecycle increments a supported API in its descriptor file to `0.x`, this implies support for `0.2-0.x` versions of that API
1. The spec may make changes it wishes in a new 0.x API so long as those changes do not preclude buildpacks implementing different 0.x APIs from running together (e.g changes to the contractual build plan that cannot be bridged by the lifecycle)
1. The platform can configure which version of the platform API the lifecycle adheres to
1. When interacting with a buildpack, the lifecycle will adhere to the API declared in each buildpack's `buildpack.toml`
1. The spec may deprecate features or usage in a given API. The lifecycle will print deprecation warnings when it encounters deprecated usage.

The lifecycle will assume the burden of maintaining compatibility, reducing the burden on platform and buildpack authors.

# Motivation
[motivation]: #motivation

Because there are far fewer lifecycle implementation than platforms or buildpacks, the lifecycle should assume the burden of maintaining compatibility. This will free platform authors to consume new lifecycles without worry and free buildpack authors to implement new APIs at their own pace.

## Non-Breaking 0.x API Versions
Originally we specified that all minor version increments in the `0.x` line would be interpreted as breaking changes when applying [compatibility rules](https://github.com/buildpacks/spec/blob/main/buildpack.md#buildpacktoml-toml).
However, a breaking change in the spec need not imply a breaking change in the lifecycle.
The existing compatibility rules have become annoying over time as they add considerable friction to specification changes. All platforms and buildpacks must explicitly update to support the new APIs before pulling in a new lifecycle.
As the community of platform and buildpack authors grows and matures, this pain is magnified.

Now that the lifecycle has matured and the APIs have partially stabilized, we can realistically guarantee that we will not make breaking lifecycle changes when adding support for a new 0.x API.

# What it is
[what-it-is]: #what-it-is

## Spec
The spec will use future `0.x` API releases to include any desired changes with one exception: the spec may not change in a way that precludes buildpacks implementing different 0.x APIs from running together.

This RFC does not make changes to the API compatibility rules post 1.0. 1.x APIs version are stil assumed to be purely additive.

## Lifecycle
The lifecycle will use the [lifecycle descriptor](https://github.com/buildpacks/rfcs/blob/pack-publish-buildpack/text/0011-lifecycle-descriptor.md)
to indicate the implemented API versions as before. However, the compatibility assumptions will change.
It will be assumed that a lifecycle declaring support for the `0.x` version of the API, supports all 0.2-0.x API versions.

### Platform API
The lifecycle will use the `CNB_PLATFORM_API` environment variable to decide which API to implement. For now, if `CNB_PLATFORM_API` is not supplied, platform API 0.3 (the currently implemented API) will be assumed, to avoid breaking existing platforms that do not currently set this environment variable.

If the API version declared in `CNB_PLATFORM_API` not supported by a given lifecycle, it will fail.

### Buildpack API
When orchestrating buildpacks, the lifecycle will provide inputs to and interpret outputs from each buildpack using the buildpack API indicated in that buildpack's `buildpack.toml` file.

If the buildpack API declared in the buildpack.toml of a non-optional buildpack is not supported by a given lifecycle, the lifecycle will fail.
If the buildpack API declared in the buildpack.toml of an optional buildpack is not supported by a given lifecycle, the lifecycle will warn, omit this buildpack from the group, and continue running.

## Deprecations
If a feature or the usage of a feature (flag names, key names, etc.) is deprecated in a given API in the spec, and a platform or buildpack uses the deprecated feature with that API, the lifecycle will print a deprecation warning.

Example:
IF in buildpack API 0.3, `launch`, `cache`, and `build` key names change in the `layer.toml` and the previous keys are retained but deprecated in the 0.3 buildpack API spec:
* IF a buildpack declares API 0.3 in it's `buildpack.toml`, AND uses the deprecated key name, THEN lifecycle will print a deprecation warning
* IF a buildpack declares API 0.2 in it's `buildpack.toml`, AND uses the deprecated key name, THEN lifecycle will NOT print a deprecation warning, b/c the keys were not deprecated in the 0.2 version of the spec.

Eventually, we may wish to entirely deprecate older APIs. A future RFC should provide a strategy for deprecations and outline the upgrade path from 0.x to 1.0 APIs. This is purposefully omitted from this RFC so that we can make progress on new 0.x APIs while we work out the details.

# How it Works
[how-it-works]: #how-it-works
## Spec
The core team must not allow changes in a 0.x API that necessarily prevents buildpacks implementing different APIs from running together.
The contractual build plan is a danger zone for such changes. This does not necessarily mean no changes can be made to the contractual build plan,
but any such changes should be made in close collaboration with the implementation team to ensure that the lifecycle can manage compatibility.

## Lifecycle
The lifecycle will maintain code for correctly implementing all supported APIs and choose which API to implement according to the rules above.

## Platforms
Platforms that wish to check lifecycle compatibility may now treat all minor API versions as non-breaking with the exception
of buildpack and platform `0.1` -> `0.2`. Platforms should always set the `CNB_PLATFORM_API` environment variable to indicate
which version of the API they are using.

## Buildpacks
Buildpacks should continue to declare the minimum required buildpack API in their `buildpack.toml`.

# Drawbacks
[drawbacks]: #drawbacks

The lifecycle must now deal with the complexity of implementing all 0.2+ APIs.

The spec may not make certain types of changes to the contractual build plan before 1.0, even if those changes are desirable, because they make concurrent support for multiple APIs impossible.

Buildpacks and platforms are likely to implement new APIs more slowly without a forcing function.

If a buildpack or platform wishes to upgrade across several API versions, it may be difficult to easily discern the cumulative set of required changes from the spec alone.
We can mitigate this with an upgrade guide in the docs.

# Alternatives
[alternatives]: #alternatives

- Keep doing what we are doing
    - This will continue to cause pain for platform and buildpack authors
- Do not allow buildpacks or platforms to select the API version. Instead, the lifecycle will always adhere to the latest version of the spec but allow for direct configuration of deprecation warnings to prevent ugly messages when a new lifecycle lands (the [previous version](https://github.com/buildpacks/rfcs/blob/121d7c56b427e55980617cc6f954b2ab02443708/text/0000-api-version-compat.md) of this RFC)

# Prior Art
[prior-art]: #prior-art

- k8s [api versioning](https://kubernetes.io/docs/concepts/overview/kubernetes-api/#api-versioning)
> We chose to version at the API level rather than at the resource or field level to ensure that the API presents a clear, consistent view of system resources and behavior, and to enable controlling access to end-of-life and/or experimental APIs. ... Note that API versioning and Software versioning are only indirectly related

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How do we navigate the upgrade to 1.0 APIs
- How do we eventually deprecate older APIs

# Spec. Changes
[spec-changes]: #spec-changes

We will remove the [compatibility rules](https://github.com/buildpacks/spec/blob/main/buildpack.md#buildpacktoml-toml) from the `buildpack.toml` section of the spec and add a new section describing any spec-level guarantees of compatibility between API versions.
 We will not attempt to define a buildpack's compatibility with a given lifecycle, thereby allowing but not requiring a given lifecycle to implement multiple API versions.

In practice, this means continuing to codify the existing compatible cases, but removing the negative cases.

Example: A lifecycle implementing buildpack API 1.1 is still guaranteed to be compatible with a buildpack implementing 1.0, by nature of the spec. No further assumptions are specified.
