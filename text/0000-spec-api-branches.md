# Meta
[meta]: #meta
- Name: Spec API branches
- Start Date: 2020-01-27
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The Cloud Native Buildpacks Specification is a collection [specifications](https://github.com/buildpacks/spec#sections), independently versioned with [API numbers](https://github.com/buildpacks/spec#api-versions). When there are major changes to these APIs, the API number is bumped. Rather than requiring a bump to the API for each change that enters the spec, this RFC proposes adding protected branches for future API versions to the spec repo. Breaking changes can be PR'd to these branches and the branches themselves will be merged to master when the core team decides that a group of changes together shall constitute the next API version.

# Motivation
[motivation]: #motivation

Changes to the Platform or Buildpack API can be disruptive, especially right now when both are pre-stable (0.x) and every change is treated as breaking. 

When we want to make several changes to a given API in short succession (i.e. in the time windows between subsequent releases of the reference lifecycle), it would be nice to use a single new API number to represent a set of breaking changes.

Given that we have decided that master of the spec repo shall always describe a specific set of API versions, we should stage changes on a branch, and merge that branch to master when we want to assign a number to the set of changes.

# What it is
[what-it-is]: #what-it-is

The spec repo shall have protected branches representing the next API version for each spec. At the time of writing, those branches would be the following: `platform/0.3`, `buildpack/0.3`, `distribution/0.2` and `extensions/bindings/0.2`. PRs to the spec that change an API (all non-cosmetic changes) should be made to those branches.

When they decide it is appropriate, the core team, in consultation with the implementation team will merge an API branch to master, bump the API versions, in the spec README (https://github.com/buildpacks/spec#api-versions), and apply a [tag](https://github.com/buildpacks/spec/releases) to master. 

# How it Works
[how-it-works]: #how-it-works

## Example - Platform API
For example, if we were following this process right now, [buildpacks/spec#68](https://github.com/buildpacks/spec/pull/68) would be made against the `platform/0.3` branch. [rfcs#46](https://github.com/buildpacks/rfcs/pull/46) is accepted, a corresponded set of spec changes would also be PR'd to the spec repo.

Once the complete set of changes that should represent Platform API 0.3 is fully staged on the branch it will be merged to master. A release of lifecycle that supports Platform API 0.3 can be shipped, and users will be able to easily lookup implemented API.

# Drawbacks
[drawbacks]: #drawbacks

* PRing the spec becomes a more complicated process
* Core team will have a new resposibility, deciding when to finalize a new API version

# Alternatives
[alternatives]: #alternatives

- PR all spec changes to master, use release tags to indicate finalized API version
- Bump the API version for every single change to the spec

# Prior Art
[prior-art]: #prior-art

Prior art seems to favor release tags rather than a master spec with pre-release branches:
* OCI spec - https://github.com/opencontainers/runtime-spec/tree/v1.0.1
* CloudEvents spec - https://github.com/cloudevents/spec/tree/master

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
