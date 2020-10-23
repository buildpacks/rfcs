# Meta
[meta]: #meta
- Name: Add base image SHA to stack metadata
- Start Date: 2020-10-23)
- Author(s): dumez-k
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Building off of this earlier [RFC](https://github.com/buildpacks/rfcs/blob/main/text/0050-stack-metadata.md) outlining stack metadata,
we would like to add a label to expose the stack base image SHA in the metadata of all stack-cnb images.

# Motivation
[motivation]: #motivation

- Allows stack users and authors to easily see which base-image that each stack cnb image is based off of.

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define the target persona: stack user, stack author

The label can be **optionally** added by stack maintainers to stack image:
 
`io.buildpacks.stack.base_image:` SHA of stack base image


# How it Works
[how-it-works]: #how-it-works

This is the technical portion of the RFC, where you explain the design in sufficient detail.

The `base_image` label will be added as a `Label` in the stack's Dockerfile.
Example:

`LABEL io.buildpacks.stack.base_image=paketobuildpacks/build@sha256:e3c1c2659c2468ea8ac8058c501293882b0a55622840eee53525f90b59d31a33`

# Drawbacks
[drawbacks]: #drawbacks

One downside is it adds slightly more output to `inspect-image` commands which some users may find extraneous.

# Alternatives
[alternatives]: #alternatives
  
- Why is this proposal the best?

  It is the simplest way to expose image metadata to users and follows existing conventions with label naming.
- What is the impact of not doing this?

  It is harder to tell which base-image each stack cnb image is using.  

# Prior Art
[prior-art]: #prior-art

Referenced RFC initially outlining stack metadata using labels: https://github.com/buildpacks/rfcs/blob/main/text/0050-stack-metadata.md

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Will the lifecycle API want to consume this label in some way?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
The platform spec should be updated to indicate that these keys can optionally be added on the build/run stack image.

https://github.com/buildpacks/spec/blob/main/platform.md
