# Meta
[meta]: #meta
- Name: Self Documenting Buildpacks
- Start Date: 1-23-2020
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC suggest a mechanism where buildpacks can provide documentation for the benefit of their consumers.

# Motivation
[motivation]: #motivation

At the moment the origin and provinence of a buildpack are are sort of a black box. Users have asked where to find information about the repos for buildpacks so they can file issues, but we would also like a method to in-situ allow buildpacks to surface their configuration options or anything else their authors think pertinent

# What it is
[what-it-is]: #what-it-is

Would add an additional, optional, field to `buildpack.toml` -  `docs`.

# How it Works
[how-it-works]: #how-it-works

The `docs` field would be of `TOML` string type. It would be expected that this field contains markdown. The rendering the contents of this field would be up to the platform implementers, but I could imagine an interface like `pack inspect-builder BUILDER --docs BUILDPACK` that would render this output to a terminal. This would allow buildpack authors to fill out arbitary information about their buildpacks such as repo, author, build and run time env vars, and other sorts of miscellaneoous documentation and configuration.

# Drawbacks
[drawbacks]: #drawbacks

Rendering markdown is hard. Yet another thing in the spec. Too generic.

# Alternatives
[alternatives]: #alternatives

- A `link` field that just points somewhere else so buildpack authors would have to host their own docs.

# Prior Art
[prior-art]: #prior-art

- Rdoc
- Golang method docs

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
