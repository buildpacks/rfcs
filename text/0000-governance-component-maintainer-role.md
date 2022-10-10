# Meta
[meta]: #meta
- Name: add component maintainer role
- Start Date: 2022-09-39
- Author(s): @jjbustamante
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [#228](https://github.com/buildpacks/rfcs/pull/228)

# Summary
[summary]: #summary

This RFC proposes the creation of a new role **component maintainer** in the project governance, responsible of executing maintainer duties on the repositories in a specific component under a CNB team.

# Definitions
[definitions]: #definitions

- **maintainers**: individual that maintain specific code repositories.
- **contributor**: individual who make regular contributions to a team (documentation, code reviews, responding to issues, participation in proposal discussions, contributing code, etc.)
- **teams**: Group of individuals focused on narrower sets of concerns related to specific aspects of the project. Example: implementation team, platform team.
- **team lead**: is a maintainer who has special responsibilities for representing team concerns at the project level
- **component maintainer**: the proposed role in this RFC. Individual that maintain specific code repositories of a software-component inside a CNB team.
- **software component**: is a software unit with a well-defined interface and explicitly specified dependencies.

# Motivation
[motivation]: #motivation

- Why should we do this?

Our current governance process defines [teams](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#teams) and each team  is responsible for maintaining some number of software components, these teams are organized internally with 3 different roles:   
  - Team Leads
  - Maintainers
  - Contributors

The process does not take into consideration the sizes of the software components that a maintainer must take accountability for or the expectations of the community contributors who made want to specialize in certain pieces of the projects, as the number and size of all the software components in a team increases we may need to distribute the responsibilities in a different way.

Compared to the model based on 3 roles, this new role should:
-  **re-balance responsibilities inside a team** empower contributors to take ownership of key components align with their technical skills or career path expectations
- **support maintainers on their role's goals** one responsibility of a maintainer is `growing the team by mentoring aspiring contributors and maintainers`, this new role offers a growing path for some contributors what would like to become maintainers.

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

### Example

Let's take for example the [Platform Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#platform-team), which right now have 2 maintainers, and let's use the LOC (lines of code) metrics, for each of the components maintains by this team, to dimension the size of it.

| Component                | LOC    |
|--------------------------|--------|
| [Pack]()                     | +58000 |
| [Tekton Tasks + Pipelines]() | +2150  |
| [CircleCI Pack Orb]()        | +400   |

**Note**: [Tokei](https://github.com/XAMPPRocky/tokei) tool was used to calculate the LOC of the repositories.

#### Integration with the Cloud Native Ecosystem

As part of the [CNB roadmap](https://github.com/buildpacks/community/blob/main/ROADMAP.md#integration-with-the-cloud-native-ecosystem) a `better out-of-the box Kubernetes and Docker integration` is a goal of the project and in order to do that, the [Platform Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#platform-team) will have to include another software component that accomplish this goal.

In case of this scenario, then an hypothetical update of the component table will be:

| Component                | LOC    |
|--------------------------|--------|
| [Pack]()                     | +58000 |
| [Tekton Tasks + Pipelines]() | +2150  |
| [CircleCI Pack Orb]()        | +400   |
| Kubernetes Native Platform implementation | ?   |

Because, this is hypothetical scenario, we actually don't have the size but, we can use [kpack]() as reference, because it is a Kubernetes Platform implementation of the CNB specification. Let's update the table again.

| Component                | LOC    |
|--------------------------|--------|
| [Pack]()                     | +58000 |
| [Tekton Tasks + Pipelines]() | +2150  |
| [CircleCI Pack Orb]()        | +400   |
| [Kpack]() | +57000  |

As we can see, a new implementation of the [Platform Interface Specification](https://github.com/buildpacks/spec/blob/main/platform.md) could be as big as [pack]() but most important:
-  It requires a specific knowledge in Kubernetes and everything related  

# How it Works
[how-it-works]: #how-it-works

The proposal is to incorporate a **component maintainer** role.

The **component maintainer** will take under his/her responsibility a well defined software component in a CNB team and for each repository will be allow to:

- reviewing, approving, and merging pull requests.
- planning release milestones, and releasing components versions
- edit, label, assign issues

An updated version of the previous diagram shows graphically this new roles

![](https://i.imgur.com/rWElkCw.png)

### Example

Let's come back to our previous example.

#### Integration with the Cloud Native Ecosystem

In this case, the existence of the **component maintainer** will provide the rules to the **platform team lead** or **platform maintainers** to nominate (following the guidelines describe in the next section) a **component maintainer** for [kpack]() when they consider is necessary.

## Guidelines nominate component maintainer

Follow this guideline to nominate a **component maintainer** for a software component inside their team

- The software component must be defined under the [GOVERNANCE](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md) team section, for example: Platform Team -> kpack
- New **component maintainers** must already be contributors of the team
- New **component maintainers** must be nominate by a **team lead** or a **maintainer** of the team under the following scenarios:  
  - A software component developed outside CNB project was [accepted](https://github.com/buildpacks/community/blob/main/contributors/guide.md#component) under their team and current team do not have the know-how or experience to handle it.
  - A community **contributor** have explicitly manifest the desire to become a **component maintainer** and the **team lead** or **maintainer** consider he/she has the skills and knowledge to take the responsibility and accountability of the component.
- New **component maintainers** must be elected by [super-majority](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#supermajority) of the team’s maintainers

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

### Do Nothing

If no new role is created, `maintainer` will continue to be accountable and responsible of all the software components inside a team.

### Repository level ownership RFC

The first attempt to addressed the problem was proposing the **repository level ownership** [RFC](https://github.com/buildpacks/rfcs/pull/228) but abandoned this idea because:
- A new role is more consistent with current governance structure
- A new role will provide more visibility to the community to identify individuals responsible for each repository.

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
