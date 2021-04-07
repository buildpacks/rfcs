# Meta
[meta]: #meta
- Name: Additions to RFC template
- Start Date: 4/7/2021
- Author(s): natalieparellano
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The existing process for creating text for release notes is largely manual. This RFC proposes adding new fields to the RFC template that could be parsed by (future) automation and added to issues and ultimately release notes via more automation.

# Motivation
[motivation]: #motivation

- Why should we do this? Automate a manual process that is currently being done by contributors and maintainers.
- What use cases does it support? Release notes for: spec, lifecycle, pack, etc.
- What is the expected outcome? More consistency in release notes text and less time spent on this process.

# What it is
[what-it-is]: #what-it-is

- Define the target persona: project contributor.

Example: For opt-in layer caching, we had the following release notes:

* spec: `Buildpacks must explicitly opt-in to layer re-use by appending to <layers>/<layer>.toml (#132, #209, RFC 0052).`
* lifecycle: `When using buildpack API 0.6 or greater, buildpacks must explicitly opt-in to layer re-use by appending to <layers>/<layer>.toml (#537 by @yaelharel)`
* migration guide: 
```text
Buildpacks must now explicitly opt-in to layer re-use by setting the launch, build, and cache keys in <layers>/<layer>.toml. If buildpacks do not modify <layers>/<layer>.toml, the layer will behave like a temporary directory, available only to the authoring buildpack, existing for the duration of a single build - even if the buildpack in the previous build set any of these keys to true.

NOTE: Additionally, the launch, build, and cache keys are moved under a new [types] table in <layers>/<layer>.toml and removed from the top level.

A Bash buildpack could write something like the following to <layers>/<layer>.toml in order to cache a layer:

cat >> layer.toml <<EOL
[types]
cache = true
EOL
```

It would be nice if this text was provided by the RFC author in the RFC template, so that when issues are generated from the RFC, the issues would already contain this text. Then when release notes are generated from those issues, the release notes would already contain this text. We could even automate the creation of the migration guides.

Example: In the RFC template:
```text
# Release Notes (OPTIONAL)
Provide a one-sentence summary of the feature that could be used to announce this feature to buildpacks users.

# Migration Guide (OPTIONAL)
Provide a one- to two-paragraph explanation of the changes required to update buildpacks and/or platforms to use this feature. Example: <link to an existing migration guide>.
```

Note that the text could still be edited in the event that the RFC author didn't foresee everything that would need to be included, as does happen. But it would give us a place to start from.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this? Higher burden of effort on RFC authors (though this could be made optional).

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered? Leave things the way they are.
- Why is this proposal the best? We're largely already including this information in RFCs today. This would just be about putting it in a more standardized format.
- What is the impact of not doing this? More toil for contributors and maintainers.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

[Spec changes](https://github.com/buildpacks/rfcs/blob/main/0000-template.md#spec-changes-optional) are currently an optional input to RFCs.
[This RFC](https://github.com/buildpacks/rfcs/pull/141) will enable future automation to create issues from RFCs.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Out of scope: implementation details of any future automation.
