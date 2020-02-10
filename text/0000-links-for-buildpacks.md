# Meta
[meta]: #meta
- Name: Buildpack links
- Start Date: 1-23-2020
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC suggest a mechanism where buildpacks can provide arbitrary links in their configuration. These links are intended to contain documentation, point to github repos, point users to readmes, etc. but should not prescribe a format.

# Motivation
[motivation]: #motivation

At the moment the origin and provenance of a buildpack are sort of a black box. Users have asked where to find information about the repos for buildpacks so they can file issues, but we would also like a method to allow buildpacks to surface their configuration options or anything else their authors think pertinent. Without prescribing a format for this need broadly, we should have a mechanism for buildpack authors to include a link they can pass to their users.

# What it is
[what-it-is]: #what-it-is

Add an additional, optional, field to `buildpack.toml` -  `homepage`.
Expand the `io.buildpacks.buildpackage.metadata` to include `homepage` if it is provided in `buildpack.toml`.

# How it Works
[how-it-works]: #how-it-works

This link would be available for platforms to display, for example `pack inspect-builder BUILDER` would dump these links like so:
```text
Buildpacks:
  ID                                                VERSION         HOMEPAGE
  org.cloudfoundry.azureapplicationinsights         v1.1.9          https://github.com/cloudfoundry/azure-application-insights-cnb

```

 Inclusion of this link would allow buildpack authors to provide a pointer to arbitrary information for their consumers.

# Drawbacks
[drawbacks]: #drawbacks

Too generic a pointer?

# Alternatives
[alternatives]: #alternatives

- A `docs` field containing markdown.

# Prior Art
[prior-art]: #prior-art

- Gemspec homepage: https://guides.rubygems.org/specification-reference/#homepage
- Npm module homepage: https://docs.npmjs.com/files/package.json#homepage
- Cargo.toml: https://doc.rust-lang.org/cargo/reference/manifest.html supports a homepage

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
