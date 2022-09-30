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

This RFC proposes the creation of a new role **component maintainer** in the project governance responsible of executing maintainer duties on specific repositories in a component of each team.

# Definitions
[definitions]: #definitions

- teams: Group of individuals focused on narrower sets of concerns related to specific aspects of the project. Example: implementation team, platform team.
- team lead:
- maintainers: Individuals that maintain specific code repositories.
- contributor:
- software component: is a software unit with a well-defined interface and explicitly specified dependencies.
- component maintainer: the proposed role in this RFC.

# Motivation
[motivation]: #motivation

- Why should we do this?

Our current governance process defines [teams](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#teams) and each team  is responsible for maintaining some number of software components, these teams are organized internally with 3 different roles:   
  - Team Leads
  - Maintainers
  - Contributors

The process does not take into consideration the sizes of the software components that a maintainer must take accountability for, as the number and size of all the software components in a team increases we may need to distribute the responsibilities in a different way.

- What use cases does it support?

It provides a mechanism to handle the increases of complexity of the source code of each component maintain by a team, when a team lead or maintainer determines a software component is big enough to be delegated to a contributor that desires to specialize and has the know-how to be responsible of a component they can nominate him/her to become **component maintainer**  

- What is the expected outcome?

# What it is
[what-it-is]: #what-it-is

For each repository of the component under his responsibility the **component maintainer** are:

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
