# Meta
[meta]: #meta
- Name: Create a Distribution Team
- Start Date: 2020-09-03
- Author(s): [@jkutner](@jkutner)
- Status: Approved
- RFC Pull Request: [rfcs#113](https://github.com/buildpacks/rfcs/pull/113)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/community#35](https://github.com/buildpacks/community/issues/35)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to create a Distribution sub-team in the project governance.

# Definitions
[definitions]: #definitions

- *sub-team* - Sub-teams are responsible for narrower sets of concerns related to specific aspects of the project. Each sub-team will include at least one core team member to help align with the broader roadmap.
- *distribution* - relates to the delivery, discovery, and integration of buildpacks.

# Motivation
[motivation]: #motivation

We have two repositories that are not owned by a specific sub-team.

# What it is
[what-it-is]: #what-it-is

The Distribution team is responsible for maintaining tools and services that support the distribution and discovery of buildpacks. It owns the following repos:

* [Buildpack Registry Index](https://github.com/buildpacks/registry-index)
* [Buildpack Registry Namespace Owners](https://github.com/buildpacks/registry-namespaces)

# How it Works
[how-it-works]: #how-it-works

The Distribution sub-team will follow the same guidelines as other sub-teams:

* include at least one core team member
* responsible for narrower sets of concerns related to specific aspects of the project

# Drawbacks
[drawbacks]: #drawbacks

- More teams
- May be difficult to sustain maintainers for all these teams
- Silos: distribution concerns and platform concerns have heavy overlap

# Alternatives
[alternatives]: #alternatives

## Do Nothing

Not an option because we would have unowned repos.

## Grow the Platform Team

We could move these repos under the Platform team, and grow the list of maintainers.

# Prior Art
[prior-art]: #prior-art

- [Platform team](https://github.com/buildpacks/community/blob/main/TEAMS.md#Platform-Team)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Who are the maintainers?
- Who are the contributors?
