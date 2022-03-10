# Meta
[meta]: #meta
- Name: Use SOURCE_DATE_EPOCH to configure image create time
- Start Date: 2022-02-24
- Author(s): natalieparellano
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

To allow for [build reproducibility](https://github.com/buildpacks/spec/blob/main/platform.md#build-reproducibility), images created by Cloud Native Buildpacks have a hard-coded create time of January 1, 1980. We have received requests from the community (see [here](https://github.com/buildpacks/pack/issues/1281) and [here](https://buildpacks.slack.com/archives/C94UJCNV6/p1643842965830459)) to allow for this value to be configurable. This RFC proposes making the value configurable by setting `SOURCE_DATE_EPOCH` in the lifecycle's execution environment during `export`.

# Definitions
[definitions]: #definitions

* build reproducibility: identical inputs should produce identical outputs ([blog post](https://medium.com/buildpacks/time-travel-with-pack-e0efd8bf05db))
* `SOURCE_DATE_EPOCH`: a "standardised environment variable that distributions can set centrally and have build tools consume this in order to produce reproducible output" (see [here](https://reproducible-builds.org/docs/source-date-epoch/))

# Motivation
[motivation]: #motivation

- Why should we do this?
  Users have asked for it
- What use cases does it support?
  A meaningful image create time, e.g., the ability to determine which images are most recent
- What is the expected outcome?
  Images built with `SOURCE_DATE_EPOCH` set will not be reproducible, as the config blob will change

# What it is
[what-it-is]: #what-it-is

- Define the target persona: buildpack user, platform operator
  * A buildpack user could pass a flag to `pack` to set `SOURCE_DATE_EPOCH` to the current time in the lifecycle's execution environment during `export`.
  * A platform operator could choose to set `SOURCE_DATE_EPOCH` whenever `export` is run.

- If applicable, describe the differences between teaching this to existing users and new users.
  We should mention this feature in the lifecycle release notes and docs.

# How it Works
[how-it-works]: #how-it-works

This [PR](https://github.com/buildpacks/imgutil/pull/137) to imgutil would read the environment variable at the point of saving the image. An alternative implementation could be to have the `exporter` read the variable and provide it via a new `SetCreatedAt()` method on the `imgutil.Image` interface. The latter might be safer as it would avoid unintended side effects for other consumers of imgutil (e.g., `pack`). 

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

Platforms that choose to set SOURCE_DATE_EPOCH to real creation time will not have 100% reproducible builds.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  * Doing nothing
  * Allowing layer timestamps to also be configurable, but this would effectively prohibit launch layer re-use and make builds slower
- Why is this proposal the best?
  * It is easy to implement, easy to use, and solves for the desired use case
- What is the impact of not doing this?
  * The lack of meaningful image create times makes it difficult to automate cleanup of images and could be a deal breaker for some users

# Prior Art
[prior-art]: #prior-art

* See under "Reading the variable" [here](https://reproducible-builds.org/docs/source-date-epoch/)
* [ko](https://github.com/google/ko#why-are-my-images-all-created-in-1970)
* [jib](https://github.com/GoogleContainerTools/jib/blob/master/docs/faq.md#why-is-my-image-created-48-years-ago)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  * Should we require users to be on platform api 0.9 in order to use this feature? (Opinion: no, because this feature is invisible if the environment variable is not set. The motivation for spec'ing this in the platform api is to make it clear for platform operators how to use it.)
- What parts of the design do you expect to be resolved through implementation of the feature?
  * Should we do this in imgutil or the lifecycle? (see above)

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

See [spec PR](https://github.com/buildpacks/spec/pull/292).
