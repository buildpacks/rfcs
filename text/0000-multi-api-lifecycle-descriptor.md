# Meta
[meta]: #meta
- Name: Lifecycle Descriptor with Multiple APIs
- Start Date: 2020-07-02
- Author(s): ekcasey
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC-0011](https://github.com/buildpacks/rfcs/blob/main/text/0011-lifecycle-descriptor.md)

# Summary
[summary]: #summary

This RFC proposed three levels of API support: `deprecated`, `supported`, and `experimental`. Supported APIs will be expressed as arrays.

This RFC introduces a new lifecycle descriptor file format, and an analogous label that should be applied to builder and lifecycle images.

# Motivation
[motivation]: #motivation

Now that the lifecycle may simultaneously support multiple APIs, the current lifecycle descriptor format, which lists exactly one platform and one buildpack API, is no longer sufficient.

In addition, we should have a mechanism for deprecating an entire API, so that buildpack and platform authors are not caught off guard when their platform or buildpack no longer works with a newer lifecycle. We likely will not choose to deprecate any APIs in the near future but building API deprecation into any new design prepares us well for the future.

Experimental APIs will give platform and buildpack authors an opportunity to try out unreleased APIs and give us feedback. This will be valuable as we prepare for the `1.0` versions of the APIs. We want to get the design of the `1.0` APIs as close to "right" as possible because `1.n` APIs will not permit breaking changes. Feedback will help us improve the design before we finalize it. The quality of feedback we get from user about their real life usage of experimental APIs will help us avoid problems we may miss when approving RFCs.

# What it is
[what-it-is]: #what-it-is

## Lifecycle Descriptor
The following is an example `lifecycle.toml` following the proposed schema:
```toml
[apis]
[apis.buildpack]
  deprecated = ["1"]
  supported = ["1.2", "2.1"]
  experimental = "3.0"
[apis.platform]
  deprecated = ["0.4"]
  supported = ["0.4", "0.5", "1.3"]
  experimental = "2.0"

[lifecycle]
  version = "0.9.0"
```
* `supproted` contain an array of support API versions:
  * for version `1.0+`, version `x.n` implies support for `x.0 - x.n`
  * `supported` should contain all deprecated and non-deprecated versions that the lifecycle supports
* `deprecated` contain an array of deprecated APIs:
  * `deprecated` apis should only contain `0.x` or major versions
* `experimental` describes a single experimental API

Given lifecycle a lifecycle with the above descriptor file:
- buildpack API versions `1.0`, `1.1` `1.2`, `2.0`, and `2.1` are supported
- buildpack API versions `1.0`, `1.1` `1.2` are deprecated
- buildpack API version `3.0` is experimental
- platform API versions `0.4`, `0.5`, `1.0`, `1.1`, `1.2` and `1.3` are supported
- platform API version `0.4` is deprecated
- platform API version `2.0` is experimental

## Lifecycle Labels 
A builder or lifecycle image with the above descriptor file should have the following labels
- key: `io.buildpacks.lifecycle.version`, value: `0.9.0`
- key: `io.buildpacks.lifecycle.apis`, value:
```json
{
  "buildpack": {
    "deprecated": ["1"],
    "supported": ["1.2", "2.4"],
    "experimental": "3.0"
  },
  "platform": {
    "deprecated": ["0.4"],
    "supported": ["0.4", "0.5", "1.3"],
    "experimental": "2.0"
  }
}
```
## API types
### Deprecated APIs
Only API versions defined in a spec release can be in the deprecated range.

New `CNB_PLATFORM_DEPRECATION_MODE`, and `CNB_BUILDPACK_DEPRECATION_MODE` environment variables will control deprecation behavior with:
* allowed values: `warn`, `error`, `silent`
* default value: `warn`

**When** the `CNB_PLATFROM_API` environment variable is set to an API version in the deprecated platform API, the lifecycle shall:
 - **If** `CNB_PLATFORM_DEPRECATION_MODE` is unset, **Then** print a warning and continue
 - **If** `CNB_PLATFORM_DEPRECATION_MODE=warn`, **Then** print a warning and continue
 - **If** `CNB_PLATFORM_DEPRECATION_MODE=error`, **Then** fail
 - **If** `CNB_PLATFORM_DEPRECATION_MODE=silent`, **Then** continue w/o warning
 
 
**When** the `api` field in a `buildpack.toml` file is set to an API version in the deprecated buildpack API range the lifecycle shall:
 - **If** `CNB_BUILDPACK_DEPRECATION_MODE` is unset, **Then** print a warning and continue
 - **If** `CNB_BUILDPACK_DEPRECATION_MODE=warn`, **Then** print a warning and continue
 - **If** `CNB_BUILDPACK_DEPRECATION_MODE=error`, **Then** fail
 - **If** `CNB_BUILDPACK_DEPRECATION_MODE=silent`, **Then** continue w/o warning

### Supported APIs
Only API versions defined in a spec release can be in the supported range.

Supported APIs will behave as expected. 

### Experimental APIs
Experimental API versions may or may not correspond to a spec release.

The behavior of experimental APIs may change between lifecycle versions without notice.

When `CNB_PLATFORM_API` or the `api` field in a `buildpack.toml` file is set to an experimental API the lifecycle will print a warning.

# How it Works
[how-it-works]: #how-it-works

## Platforms
Platforms should use the contents of `lifecycle.toml` to set `io.buildpacks.lifecycle.version`, and `io.buildpacks.lifecycle.apis` labels when creating builders.

The lifecycle will set `io.buildpacks.lifecycle.version` and `io.buildpacks.lifecycle.apis` on all future released lifecycle images.

Platforms may use the contents of the `io.buildpacks.lifecycle.apis` label when deciding which `CNB_PLATFORM_API` to use, or validating whether a buildpack is compatible with a given builder image.

### `pack`
`pack inspect-builder` should display deprecated, supported, and experimental API information when it is available.

## Backwards Compatibility

Currently lifecycle API and verison information is contained in the `io.buildpacks.builder.metadata` label. The following is an abridged example label
```
{
  "buildpacks": [],
  "created-by": {}
  "description": "",
  "lifecycle": {
    "version": "<lifecycle version>",
    "api": {
      "buildpack": "<buildpack API version>",
      "platform": "<platform API version>"
    }
  },
  "stack": {},
}
```
For backwards compatibility `pack create-builder` should continue to populate the above label, setting `lifecycle.api.buildpack`, and `lifecycle.api.platform` to the corresponding supported `min`.

This will allow platforms the read the metadata in it's existing format to update gracefully. Eventually this compatibility layer will be removed.

The lifecycle descriptor file itself will not preserve backwards compatibility. Most platforms consume builders rather than directly consuming lifecycle artifacts, and therefore the builder label is the important compatibility concern. Those platforms that do consume lifecycle artifacts control which versions of the lifecycle they bring in and can update their behavior to parse the new format for newer lifecycles.

# Drawbacks
[drawbacks]: #drawbacks

Understanding buildpack/platform API support will require more documentation and education.

# Alternatives
[alternatives]: #alternatives

- We could have `deprected` and `supported` lists instead of using `min` and `max` to define ranges.
- We could stick with a single `api.buildpack` and `api.platform` in the lifecycle descriptor and let platforms infer support ranges based on the guidelines outlined in [RFC-0041](https://github.com/buildpacks/rfcs/blob/main/text/0041-api-version-compat.md#non-breaking-0x-api-versions)
- Instead of introducing deprecated APIs we could commit to never deprecating or removing support for older APIs

# Prior Art
[prior-art]: #prior-art

* Experimental APIs are similar to [alpha level APIs](https://kubernetes.io/docs/concepts/overview/kubernetes-api/#api-versioning) in Kubernetes.
* https://kubernetes.io/docs/reference/using-api/deprecation-policy/

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should the lifecycle warn when an experimental API is used?
- Should we support a range of experimental APIs instead of a single API?
- Should we require platforms to turn on support for experimental APIs with an environment variable?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This RFC will not result in spec changes. The lifecycle descriptor file and builder labels are unspecified features.
