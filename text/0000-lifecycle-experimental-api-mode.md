# Meta
[meta]: #meta
- Name: Lifecycle Experimental API Mode
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
/AP
# What it is
[what-it-is]: #what-it-is

`experimental` is a new API mode for testing out unreleased API / spec changes on their path to being finalized. An experimental API can not be `deprecated` or `supported` as defined in [RFC#49](https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md).

## Lifecycle Descriptor

This RFC proposes the addition of the `experimental` key in `lifecycle.toml` following the proposed schema:

```
[apis]
[apis.buildpack]
  experimental = ["0.6-rc1", "1.0-alpha1"]
[apis.platform]
  experimental = ["1.0-alpha1"]

[lifecycle]
  version = "0.10.0"
```
`experimental`:
contains an array of experimental API versions
the APIs will correspond to specs that may not be released and in branches that are still being worked on.
the API version must be of the format: `<major>.<minor>-<alphanumeric>`, i.e. `1.0-alpha1`.

Since experimental versions are defined with a different format, they will NOT automatically get upgraded to a `supported` release when the experimental API has finalized.

## Lifecycle Labels
This will extend the builder or lifecycle image with the above descriptor file will extend the label `io.buildpacks.lifecycle.apis` with the value:
```json
{
  "buildpack": {
    "experimental": ["0.6-rc1", "1.0-alpha1"],
  },
  "platform": {
    "experimental": ["1.0-alpha1"],
  }
}
```

## API Types
### Experimental APIs
API versions aren't limited to those defined in a spec release, but can refer to upcoming spec work happening in a branch.

New `CNB_PLATFORM_EXPERIMENTAL_MODE` and `CNB_BUILDPACK_EXPERIMENTAL` mode environment variables will control experimental mode with:
allowed values: `warn`, `error`, `silent`
default value: `warn`

**When** the `CNB_PLATFROM_API` environment variable is set to an API version in the deprecated platform API, the lifecycle shall:
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE` is unset, **Then** print a warning and continue
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE=warn`, **Then** print a warning and continue
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE=error`, **Then** fail
 - **If** `CNB_PLATFORM_EXPERIMENTAL_MODE=silent`, **Then** continue w/o warning

**When** the `api` field in a `buildpack.toml` file is set to an API version in the deprecated buildpack API range the lifecycle shall:
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE` is unset, **Then** print a warning and continue
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE=warn`, **Then** print a warning and continue
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE=error`, **Then** fail
 - **If** `CNB_BUILDPACK_EXPERIMENTAL_MODE=silent`, **Then** continue w/o warning

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

# Prior Art
[prior-art]: #prior-art

## Rust Unstable Features
Rust has the concept of [Unstable Features](https://doc.rust-lang.org/beta/unstable-book/the-unstable-book.html) where they have to be explicitly enabled in code. They're all documented in one place.

## Heroku API Stability Attribute
The Heroku API marks the status of every API endpoint with the [`stability' attribute](https://devcenter.heroku.com/articles/platform-api-reference#stability).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
How does an experimental version map to the branch?
Is there a better word than "experimental"?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This RFC will not result in spec changes. The lifecycle descriptor file and builder labels are unspecified features.
