# Meta
[meta]: #meta
- Name: Remove Lifecycle Credential Helpers Integration
- Start Date: 2020-01-22
- CNB Pull Request: [rfcs#49](https://github.com/buildpacks/rfcs/pull/49)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Right now `analyzer` and `exporter` have a boolean `-helpers` flag. When supplied the `-helpers` flag, those lifecycle phases modify the docker `config.json`, `credHelpers` entries mapping well known registries to their associated credential helpers.

This RFC proposes entirely **removing** this feature.

# Motivation
[motivation]: #motivation

There are several reasons to consider removing this feature:

* `-helpers` breaks the build if the corresponding helper binaries are not installed. There is no guarantee that the credential helper binaries are installed on the build image.
* The `-helpers` flag gives the false impression that credential helper binaries will be provided.
* None of the most popular build images ( `heroku/pack:18-build`, `cloudfoundry/build:base-cnb`, `cloudfoundry/build:full-cnb`) have the credential helper binaries installed
* None of following platforms require it
  - pack - resolves registry config on the host and then injects it into the container
  - tekton - configures your docker config from annotated k8s secrets
  - kpack - configures your docker config from annotated k8s secrets
* Stack authors can still provide credential helper integration without requiring lifecycle integration. In addition to installing credential helper binaries on the build image, stack authors can add a docker config file with the corresponding entries, if they wish.

# What it is
[what-it-is]: #what-it-is

Complete removal of all credential helper integration from the lifecycle.

# How it Works
[how-it-works]: #how-it-works

It doesn't do anything, which is less confusing than the current state of affairs.

# Drawbacks
[drawbacks]: #drawbacks

**If** there was a stack that had credential helpers installed on the build image **and** the build was running in a public cloud, **and** it was running in a platform that didn't have a preferred method of authentication, **then** it could be useful.

# Alternatives
[alternatives]: #alternatives

- leave it the way it is

# Prior Art
[prior-art]: #prior-art

In tekton, which can run many different build tools in containers, it is assumed that the platform will setup the docker config rather than the build tool itself.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Is there any existing platform that uses this feature?
