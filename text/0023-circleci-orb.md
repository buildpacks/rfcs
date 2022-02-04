# Meta
[meta]: #meta
- Name: Support a CircleCI Orb
- Start Date: 2019-12-15
- Status: Approved
- CNB Pull Request: [rfcs#39](https://github.com/buildpacks/rfcs/pull/39)
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

We move the [jkutner/buildpacks-orb](https://github.com/jkutner/buildpacks-orb) repo into the `github.com/buildpacks` org, and publish it as `buildpacks/pack`. The repository will be maintained by the [Platform Team](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#platform-team).

The Orb's major and minor version number will represent the version of `pack` it uses. But the patch version will be incremented independently. Thus, `buildpacks/pack@0.5.42` could correspond to version `0.5.0` of `pack`.

# Drawbacks
[drawbacks]: #drawbacks

- We must support the Orb, which could create additional release burden.
- We are encouraging a pattern that is sub-optimal in terms of performance (i.e. running pack instead of lifecycle directly)

# Alternatives
[alternatives]: #alternatives

- Document how to use buildpacks on CircleCI without an Orb
- Integrate with a different CI/CD platform like Jenkins

## Run lifecycle instead of pack

Instead of a job that runs `pack build`, we could implement a job that runs each of the lifecycle steps in a container. This has the advantage of decoupling from pack and not requiring the Docker daemon (like the [Tekton Template](https://github.com/tektoncd/catalog/blob/master/buildpacks/buildpacks-v3.yaml)). However, there are also some disadvantages:

* Running lifecycle alone would not support download buildpacks as with `--buildpack` option in pack (you'd have to do it manually)
* Running lifecycle along would not support `project.toml` when it is shipped.
* There is no mechanism to `create-builder` or `create-package` without pack.
* Some of the CircleCI features that would make this approach advantagous are paid-only like `docker_layer_caching`
* CircleCI will not cache the stack images

An example of what this Orb might look like is the following:

```yaml
jobs:
  build:
    working_directory: /workspace
    docker:
    - image: << parameters.builder >>
    parameters:
      image-name:
        type: string
      builder:
        type: string
    steps:
      - checkout
      - run: mkdir /tmp/cache
      - restore_cache:
          key: cnb-cache-<< parameters.image-name >>-<< parameters.builder >>-{{ arch }}
      - run:
          command: /cnb/lifecycle/detector
          name: Detect
      - run:
          command: /cnb/lifecycle/restorer -path /tmp/cache
          name: Restore
      - run:
          command: /cnb/lifecycle/analyzer << parameters.image-name >>
          name: Analyze
      - run:
          command: /cnb/lifecycle/builder
          name: Build
      - run:
          command: /cnb/lifecycle/exporter << parameters.image-name >>
          name: Export
      - run:
          command: /cnb/lifecycle/cacher -path /tmp/cache
          name: Cache
      - save_cache:
          key: cnb-cache-<< parameters.image-name >>-<< parameters.builder >>-{{ arch }}-{{ epoch }}
          paths:
            - /tmp/cache
```

In the future, we should implement an orb/job that runs lifecycle independently from pack. Ideally if we have a `/lifecycle/prepare` or similar phase that handles `project.toml` and setup/download of buildpacks. But in order to support the full feature set of pack we will start with the proposal in this RFC.

# Prior Art
[prior-art]: #prior-art

- [circleci/docker](https://circleci.com/orbs/registry/orb/circleci/docker)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What versions will the Orb support?
- Will the Orb be able to run `lifecycle` w/o pack (Tekton style)
- Should we use this as the start for documentation on "How to move beyond pack"?
    - Is the process of how this is implemented just as important as the working thing so others can learn how to use CNB in their own prod environment?
