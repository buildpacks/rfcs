# Meta
[meta]: #meta
- Name: Prelease APIs and Experimental Features
- Start Date: 2020-08-25
- Author(s): @hone
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC#49](https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md)

# Summary
[summary]: #summary

This RFC proposes the addition of a third API mode `experimental` and extends [RFC#49](https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md).

# Definitions
[definitions]: #definitions

experimental - a new API mode that is marked as experimental. Unlike supported and deprecated APIs, this may be for an unreleased API. The purpose is to gather feedback that will be used to improve the design before it's finalized. It will not carry the same promise of stability or compatibility.

# Motivation
[motivation]: #motivation

In order to have a smooth transition to 1.0 of the spec, there needs to be a way for the project to test out these ideas in the wild and gather feedback. Even beyond 1.0, this desire still stands for testing out concepts in an organized fashion where the feedback can be provided. This feedback will help us improve the design before we finalize it. The quality of feedback we get from users about their real life usage of experimental APIs will help us avoid problems we may miss when approving RFCs.

# What it is
[what-it-is]: #what-it-is

This proposes two changes to Lifecycle:
* Prerelease API versions which is used for testing API / spec changes.
* `experimental` is a new API mode for testing implementation of the API similar to the modes defined in [RFC#49](https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md).

## Prerelease API
A prerelease API is a non-finalized API but is in a testable state. The the API version must be of the format: `<major>.<minor>-<alphanumeric>`, i.e. `1.0-alpha1`. Though these aren't final, there will be a tagged and release version of the appropriate spec for it. This way users can see what is supported when it's used. In most cases, these will be cut from the corresponding branch in `buildpacks/spec`, i.e. Buildpack API `0.5-alpha1` would be cut from the `buildpack/0.5` branch.

When Lifecycle supports a prerelease API, it can be treated like any other API version and be used in any mode: `experimental`, `supported`, `deprecated`.

### Experimental Features in the API
For APIs that will need to stabilize over a long time span, they can get added as an "experimental" section inside the API as **Experimental Features**. These will go out into official API releases. Using that part of the API will be experimental and susceptible to change in an upcoming release. This will require a bit more rigor, but will allow us to evolve the experimental sections overtime without as much pressure to "get it right" or "block a release". The downside is that the lifecycle will need to suppert these experimental features since they're part of the API. If the experimental API changes a lot, lifecycle will need to support these differences.

There will be a new `CNB_PLATFORM_EXPERIMENTAL_FEATURES` environment variable to control ALL experimental features by the platform. This will let a platform decide if they want to turn on experimental features. For now, all features will be turned on/off for simplicity. If the need arises, a list in the future can be explored.

allowed values: `warn`, `error`, `silent`
default value: `warn`

**When** lifecycle detects an experimental feature is being used:
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE` is unset, **Then** print a warning and continue
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE=warn`, **Then** print a warning and continue
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE=error`, **Then** fail
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE=silent`, **Then** continue w/o warning

## Lifecycle Descriptor
This RFC proposes support for prerelease API versions in the modes:

```
[apis]
[apis.buildpack]
  supported = ["0.5", "0.7-alpha1"]
  deprecated = ["0.4", "0.5-rc1"]
[apis.platform]
  supported = ["0.6", "0.7-alpha1"]
  deprecated = ["0.5", "0.6-rc1"]

[lifecycle]
  version = "0.10.0"
```

Since experimental versions are defined with a different format, they will NOT automatically get upgraded to a `supported` release when the experimental API has finalized.

### Lifecycle Labels
This will extend the the `io.buildpacks.lifecycle.apis` label on the builder or lifecycle image with the values contained in the above descriptor file. For example:

```json
{
  "buildpack": {
    "supported": ["0.5", "0.7-alpha1"],
    "deprecated": ["0.4", "0.5-rc1"]
  },
  "platform": {
    "supported": ["0.6", "0.7-alpha1"],
    "deprecated": ["0.5", "0.6-rc1"]
  }
}
```

# How it Works
[how-it-works]: #how-it-works

The technical implementation will follow what's outlined in [RFC#49](https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md).

# Drawbacks
[drawbacks]: #drawbacks
This will add more complexity/overhead that most users will not use.

# Alternatives
[alternatives]: #alternatives

## Do Nothing
If we choose to do nothing, we run the risk of releasing less tested API/spec releases.

### Not a Different Version Format
The Experimental API version format could instead follow the same format as deprecated and supported: `<major>-<minor>`. By doing this, users could automatically get upgraded from an experimental to supported/deprecated API version which may be surprising to them.

### Unstable Features
Similar to [RFC#91](https://github.com/buildpacks/rfcs/pull/91), instead of tying features to a specific release, features can be tied behind flags for testing. There's a potential this could be complicated to do if the features are coupled to other changes going on in the API/spec. The benefit is folks can try out individual features in a more explicit way.


## Experimental API Mode
A new mode for testing implementation of a API. The API can be a full release or a prerelease API.

New `CNB_PLATFORM_EXPERIMENTAL_MODE` mode environment variable will control experimental mode with:
allowed values: `warn`, `error`, `silent`
default value: `warn`

**When** the `api` field in a `buildpack.toml` file is set to an API version in the experimental buildpack API range the lifecycle shall:
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE` is unset, **Then** print a warning and continue
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE=warn`, **Then** print a warning and continue
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE=error`, **Then** fail
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE=silent`, **Then** continue w/o warning

### Lifecycle Descriptor

This adds the `experimental` key in `lifecycle.toml` following the proposed schema:

```
[apis]
[apis.buildpack]
  experimental = ["0.6", "1.0-alpha1"]
  supported = ["0.5", "0.7-alpha1"]
  deprecated = ["0.4", "0.5-rc1"]
[apis.platform]
  experimental = ["1.0-alpha1"]
  supported = ["0.6", "0.7-alpha1"]
  deprecated = ["0.5", "0.6-rc1"]

[lifecycle]
  version = "0.10.0"
```

Walking through the Buildpack API side of the example above, the Buildpack API is testing out spec changes for `1.0` with `1.0-alpha1` and `0.7` with `0.7-alpha1`. Buildpack API `0.6` has finalized, but since it included some large features the implementation may under go some changes. Buildpack API `1.0-alpha1` is both experimental in the spec and implementation.

### Lifecycle Labels
This will extend the the `io.buildpacks.lifecycle.apis` label on the builder or lifecycle image with the values contained in the above descriptor file. For example:
```json
{
  "buildpack": {
    "experimental": ["0.6", "1.0-alpha"],
    "supported": ["0.5", "0.7-alpha1"],
    "deprecated": ["0.4", "0.5-rc1"]
  },
  "platform": {
    "experimental": ["1.0-alpha1"],
    "supported": ["0.6", "0.7-alpha1"],
    "deprecated": ["0.5", "0.6-rc1"]
  }
}
```

# Prior Art
[prior-art]: #prior-art

## Rust Unstable Features
Rust has the concept of [Unstable Features](https://doc.rust-lang.org/beta/unstable-book/the-unstable-book.html) where they have to be explicitly enabled in code. They're all documented in one place.

## Heroku API Stability Attribute
The Heroku API marks the status of every API endpoint with the [`stability' attribute](https://devcenter.heroku.com/articles/platform-api-reference#stability).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
- Is there a better word than "experimental"?
- Is it a concern that a user setting a API version to "0.7" which in Lifecycle Version A is experimental but later on in Lifecycle Version B is supported? What do expect the changes coming from "implementation" that could affect users?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This RFC will not result in spec changes. The lifecycle descriptor file and builder labels are unspecified features.
