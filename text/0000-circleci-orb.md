# Meta
[meta]: #meta
- Name: Support a CircleCI Orb
- Start Date: 2019-12-15
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for officially supporting a [CircleCI Orb](https://circleci.com/orbs/) that runs buildpacks.

# Motivation
[motivation]: #motivation

One of the questions we often get is "how do I use buildpacks in my production pipeline?" The `pack` CLI is great for local development, but integrating into a CI/CD pipeline requires a little imagination. By official supporting a CircleCI Orb, we'll make it dead simple for people to use buildpacks on CircleCI and we'll help users of other CI/CD platforms get an idea how to integrate buildpacks.

# What it is
[what-it-is]: #what-it-is

We publish a `buildpacks/pack` Orb that can be used in a repo's `.circleci/config.yml` thusly:

```yaml
version: 2.1
description: Cloud Native Buildpacks sample app

orbs:
  pack: buildpacks/pack@0.6.0

workflows:
  version: 2.1
  main:
    jobs:
      - pack/build:
          image-name: myimage
          builder: heroku/buildpacks:18
```

# How it Works
[how-it-works]: #how-it-works

We move the [jkutner/buildpacks-orb](https://github.com/jkutner/buildpacks-orb) repo into the `github.com/buildpacks` org, and publish it as `buildpacks/pack`

The Orb's major and minor version number will represent the version of `pack` it uses. But the patch version will be incremented independently. Thus, `buildpacks/pack@0.5.42` could correspond to version `0.5.0` of `pack`.

# Drawbacks
[drawbacks]: #drawbacks

- We must support the Orb, which could create additional release burden.

# Alternatives
[alternatives]: #alternatives

- Document how to use buildpacks on CircleCI without an Orb
- Integrate with a different CI/CD platform like Jenkins

# Prior Art
[prior-art]: #prior-art

- [circleci/docker](https://circleci.com/orbs/registry/orb/circleci/docker)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What versions will the Orb support?
- Will the Orb be able to run `lifecycle` w/o pack (Tekton style)
