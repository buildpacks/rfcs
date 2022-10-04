# Meta
[meta]: #meta
- Name: add component maintainer role
- Start Date: 2022-09-39
- Author(s): @jjbustamante
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes the creation of a new role **component maintainer** in the project governance, responsible of executing maintainer duties on the repositories in a specific component under a CNB team.

# Definitions
[definitions]: #definitions

- teams: Group of individuals focused on narrower sets of concerns related to specific aspects of the project. Example: implementation team, platform team.
- maintainers: individual that maintain specific code repositories.
- team lead: is a maintainer who has special responsibilities for representing team concerns at the project level
- contributor: individual who make regular contributions to a team (documentation, code reviews, responding to issues, participation in proposal discussions, contributing code, etc.)
- software component: is a software unit with a well-defined interface and explicitly specified dependencies.
- component maintainer: the proposed role in this RFC.

# Motivation
[motivation]: #motivation

- Why should we do this?

Our current governance process defines [teams](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#teams) and each team  is responsible for maintaining some number of software components, these teams are organized internally with 3 different roles:   
  - Team Leads
  - Maintainers
  - Contributors

The process does not take into consideration the sizes of the software components that a maintainer must take accountability for or the expectations of the community contributors who made want to specialize in certain pieces of the projects, as the number and size of all the software components in a team increases we may need to distribute the responsibilities in a different way.

- What use cases does it support?

It provides a mechanism to handle the increases of complexity of the source code of each component maintain by a team, when a team lead or maintainer determines a software component is big enough to be delegated to a contributor that desires to specialize and has the know-how to be responsible of a component they can nominate him/her to become **component maintainer** and delegates some of the day to day activities to this person.

- What is the expected outcome?

A new role and guideline on how to nominate individuals to this role will be include it in our governance process.

# What it is
[what-it-is]: #what-it-is

CNB maintainer contributor responsibility can be describe as: `is in charge of the day to day maintenance of the team's projects`

![](https://i.imgur.com/yXsLK6N.png)

As we can see in diagram above, a CNB team takes care of `N` number of [software components](#definitions) and the project contributors from the community make them contributions to any of those components.

Depending on the team, these components can increase in size or complexity, or there could be someone from the community that wants to specialize their contributions on certain components without taking the responsibility of become a **team maintainer**.

The proposal is to incorporate a **component maintainer** role.

![](https://i.imgur.com/rWElkCw.png)

The **component maintainer** will take under his/her responsibility a well defined software component in a CNB team and for each repository will be allow to:

- reviewing, approving, and merging pull requests.
- planning release milestones, and releasing components versions
- edit, label, assign issues

# How it Works
[how-it-works]: #how-it-works

## Guidelines nominate component maintainer

A Team Lead or a Maintainer will follow this guideline to nominate a component maintainer for some software component inside their team

- A software component developed outside CNB project was [accepted](https://github.com/buildpacks/community/blob/main/contributors/guide.md#component) and current team do not have the know-how or experience to handle it.


# Migration
[migration]: #migration

None

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?
- Yet another role
- We decide to wait until the problem arises

# Alternatives
[alternatives]: #alternatives

## Do Nothing

If no new role is created, `maintainer` will continue to be accountable and responsible of all the software components inside a team.


# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

<!--
- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
-->

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

None

# History
[history]: #history

None

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->
