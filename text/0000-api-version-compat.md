# Meta
[meta]: #meta
- Name: Lifecycle API version support changes
- Start Date: 2020-05-14
- Author(s): [Emily Casey](https://github.com/ekcasey)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)

# Summary
[summary]: #summary

To enable smoother migrations and upgrades this RFC proposes the following changes to the API version compatibility rules:

1. When the lifecycle increments a supported API in its descriptor file to `0.x`, this implies support for `0.2-0.x` versions of that API
1. The spec may make changes it wishes in a new 0.x API so long as those changes do not preclude buildpacks implementing different 0.x APIs from running together (e.g changes to the contractual build plan that cannot be bridged by the lifecycle)
1. The platform can configure which version of the API the lifecycle implements
1. When interacting with a buildpack, the lifecycle will use the API declared in each buildpack's `buildpack.toml`

The lifecycle will assume the burden of maintaining compatibility, reducing the burden on platform and buildpack authors.  

# Motivation
[motivation]: #motivation

Because there are far fewer lifecycle implementation than platforms or buildpacks, the lifecycle should assume the burden of maintaining compatibility. This will free platform authors to consume new lifecycles without worry and free buildpack authors to implement new APIs at their own pace. 

## Non-Breaking 0.x API Versions
Originally we specified that all minor version increments in the `0.x` line would be interpreted as breaking changes, when applying [compatibility rules](https://github.com/buildpacks/spec/blob/master/buildpack.md#buildpacktoml-toml).
This was the correct decision initially b/c we needed a way to indicate breaking changes before the APIs reached 1.0.
However, this has become annoying over time as it adds considerable friction to specification changes. All platforms and buildpacks must explicitly update to support the new APIs before pulling in a new lifecycle.
As the community of platform and buildpack authors grows and matures, this pain is magnified.

Now that the lifecycle has matured and the APIs have stabilized, we can realistically guarantee that we will not make breaking lifecycle changes before the implementation of the 1.0 APIs are released.

## Deprecations
Once the 1.0 API is supported, we may wish to deprecate older APIs. A future RFC should provide a strategy for deprecations and outline the upgrade path from 0.x to 1.0 APIs. This is purposefully omitted from this RFC so that we can make progress on new 0.x APIs while we work out the details.

# What it is
[what-it-is]: #what-it-is

## Spec
The spec will use future `0.x` API releases to include any desired changes with one exception: the spec may not change in a way that precludes buildpacks implementing different 0.x APIs from running together.

## Lifecycle
The lifecycle will use the [lifecycle descriptor](https://github.com/buildpacks/rfcs/blob/pack-publish-buildpack/text/0011-lifecycle-descriptor.md)
to indicate the implemented API versions as before. However, the compatibility assumptions will change.
It will be assumed that a lifecycle declaring support for the `0.x` version of the API, supports all 0.2-0.x API versions.

### Platform API
The lifecycle will use the `CNB_PLATFORM_API` environment variable to decide which API to implement. For now, if `CNB_PLATFORM_API` is not supplied, platform API 0.3 (the currently implemented API) will be assumed, to avoid breaking existing platforms that do not currently set this environment variable.

If the API version declared in `CNB_PLATFORM_API` is higher than the newest supported by a given lifecycle, it will fail.

### Buildpack API
When orchestrating buildpacks, the lifecycle will provide inputs to and interpret outputs from each buildpack using the buildpack API indicated in that buildpack's `buildpack.toml` file.

If the buildpack API declared in the buildpack.toml of a non-optional buildpack is higher than the newest supported by a given lifecycle, the lifecycle will fail.
If the buildpack API declared in the buildpack.toml of an optional buildpack is higher than the newest supported by a given lifecycle, the lifecycle will warn, omit this buildpack from the group, and continue running.

## Deprecations
Once the 1.0 API is supported, we may wish to deprecate older APIs. A future RFC should provide a strategy for deprecations and outline the upgrade path from 0.x to 1.0 APIs. This is purposefully omitted from this RFC so that we can make progress on new 0.x APIs while we work out the details.

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

The spec may not make certain types of changes to the contractual build plan before 1.0, even if those changes are desirable.

Buildpacks and platforms are likely to implement new APIs more slowly without a forcing function.

# Alternatives
[alternatives]: #alternatives

- Keep doing what we are doing
    - This will continue to cause pain for platform and buildpack authors
- Do not allow breaking changes in the spec itself, instead add deprecation to the spec and print feature level deprecation warning (the previous version of this RFC + suggestions from commenters)

# Prior Art
[prior-art]: #prior-art

- k8s [api versioning](https://kubernetes.io/docs/concepts/overview/kubernetes-api/#api-versioning)
> We chose to version at the API level rather than at the resource or field level to ensure that the API presents a clear, consistent view of system resources and behavior, and to enable controlling access to end-of-life and/or experimental APIs. ... Note that API versioning and Software versioning are only indirectly related



# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Will we allow breaking changes in a minor API version in the spec itself post `1.0`?
- How do we navigate the upgrade to 1.0 APIs
- How do we eventually deprecate older APIs

# Spec. Changes
[spec-changes]: #spec-changes
The compatibility rules described in https://github.com/buildpacks/spec/blob/master/buildpack.md#buildpacktoml-toml will change to remove the special consideration for `0.x` API versions.
