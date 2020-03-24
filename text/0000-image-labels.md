# Meta
[meta]: #meta
- Name: Image Labels
- Start Date: 2020-03-24
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Buildpacks should be able to expose arbitrary label metadata on images.  This content should be exposed by enhancing buildpack artifacts.

# Motivation
[motivation]: #motivation

While buildpacks create OCI images, the standard does not expose all elements that OCI images can support to buildpack authors.  One of these elements, [image labels][l], is regularly requested by users in order to contribute both [standard][s] and arbitrary metadata to their generated images.  Once delivered, this functionality would let buildpack authors contribute labels to the images their buildpacks create.

[l]: https://docs.docker.com/engine/reference/builder/#label
[s]: https://github.com/opencontainers/image-spec/blob/master/annotations.md#pre-defined-annotation-keys

# What it is
[what-it-is]: #what-it-is

Buildpacks must be able to contribute arbitrary key-value pairs that will be placed as labels on images.  This can be added as a non-breaking change to `launch.toml` as a peer to `processes` and `slices`. It should be comprised of a collection of items, each with `key` and `value` entries.

```toml
[[labels]]
key = "<label key 1>"
value = "<label value 1>"

[[labels]]
key = "<label key 2>"
value = "<label value 2>"
```

Buildpack users will likely want to be able to contribute labels directly as well, but exposure of that functionality should be a platform-concern and implemented in a UX-native way by each platform rather than being standardized.  A buildpack that allows contribution via user-configuration could be used as a stop-gap solution until a platform supports UX-native contribution and as the only solution for platforms that never do.

# How it Works
[how-it-works]: #how-it-works

The collected contents of the `labels` entries contributed by each buildpack should be contributed to the image's `.Config.Labels` collection.

# Drawbacks
[drawbacks]: #drawbacks

There's no reason not to do this.

# Alternatives
[alternatives]: #alternatives

This is a straightforward community request and no other designs have been considered.

# Prior Art
[prior-art]: #prior-art

* [Docker `LABEL` Directive][d]

[d]: https://docs.docker.com/engine/reference/builder/#label

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

It is possible that given arbitrary labeling, some or all of the BOM might be migrated to labels.  At this time, without a comprehensive story around contributed dependencies, trying to describe that migration isn't appropriate.  It should be kept in mind as another possible step once this has been accepted.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Changes to `launch.toml` are required as part of this RFC.  A collection of `labels` objects consisting of `key` and `value` fields will be added.
