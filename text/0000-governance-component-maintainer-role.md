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
- **github team**: groups of organization members that reflects a company or group's structure with cascading access permissions.

# Motivation
[motivation]: #motivation

### Why should we do this?

Our current governance process defines [teams](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#teams) and each team  is responsible for maintaining some number of software components, these teams are organized internally with 3 different roles:   
  - Team Leads
  - Maintainers
  - Contributors

The process does not take into consideration the sizes of the software components that a maintainer must take accountability for or the expectations of the community contributors who made want to specialize in certain pieces of the projects, as the number and size of all the software components in a team increases we may need to distribute the responsibilities in a different way.

Compared to the model based on 3 roles, this new role should:
-  **re-balance responsibilities inside a team** empower contributors to take ownership of key components align with their technical skills or career path expectations
- **support maintainers on their role's goals** one responsibility of a maintainer is `growing the team by mentoring aspiring contributors and maintainers`, this new role offers a growing path for some contributors what would like to become maintainers.

### What use cases does it support?

It provides a mechanism to handle the increases of complexity of the source code of each component maintain by a team, when a team lead or maintainer determines a software component is big enough to be delegated to a contributor that desires to specialize and has the know-how to be responsible of a component they can nominate him/her to become **component maintainer** and delegates some of the day to day activities to this person.

### What is the expected outcome?

A new role and guideline on how to nominate individuals to this role will be include it in our governance process.

# What it is
[what-it-is]: #what-it-is

CNB maintainer contributor responsibility can be describe as: `is in charge of the day to day maintenance of the team's projects`

![](https://i.imgur.com/yXsLK6N.png)

As we can see in diagram above, a CNB team takes care of `N` number of [software components](#definitions) and the project contributors from the community make their contributions to any of those components.

Depending on the team, these components can increase in size or complexity, or there could be someone from the community that wants to specialize their contributions on certain components without taking the responsibility of become a **team maintainer**.

### Examples

#### Platform Team

Let's take for example the [Platform Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#platform-team), which right now have 2 maintainers, and let's use the LOC (lines of code) metric, for each of the components maintains by this team, to dimension the size of them.

| Component                | LOC    |
|--------------------------|--------|
| [Pack]()                     | +58000 |
| [Tekton Tasks + Pipelines]() | +2150  |
| [CircleCI Pack Orb]()        | +400   |

**Note**: [Tokei](https://github.com/XAMPPRocky/tokei) tool was used to calculate the LOC of the repositories.

##### Integration with the Cloud Native Ecosystem

As part of the [CNB roadmap](https://github.com/buildpacks/community/blob/main/ROADMAP.md#integration-with-the-cloud-native-ecosystem) a `better out-of-the box Kubernetes and Docker integration` is a goal of the project and in order to do that, the [Platform Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#platform-team) will have to include another software component that accomplish this goal.

In case of this scenario, then an hypothetical update of the component table if kpack project is donated into CNB (see [RFC](https://github.com/buildpacks/rfcs/pull/235) for more details) will be:


| Component                | LOC    |
|--------------------------|--------|
| [Pack]()                     | +58000 |
| [Tekton Tasks + Pipelines]() | +2150  |
| [CircleCI Pack Orb]()        | +400   |
| [Kpack]() | +57000  |

As we can see, a new implementation of the [Platform Interface Specification](https://github.com/buildpacks/spec/blob/main/platform.md) could be as big as [pack]() but most important:
-  It requires a specific knowledge in [Kubernetes](https://kubernetes.io/)

##### Adding Cosign integration

Another example of the problem presented in this RFC is: [adding support to cosign RFC](https://github.com/buildpacks/rfcs/pull/195). In this RFC a new phase executable must be developed and maintain by the [Platform team](https://github.com/buildpacks/community/blob/main/TEAMS.md#platform-team), but this implementation requires knowledge and expertise on technologies like [sigstore](https://www.sigstore.dev/).

# How it Works
[how-it-works]: #how-it-works

The proposal is to incorporate a **component maintainer** role in our governance process.

The **component maintainer** will take under his/her responsibility a well defined software component in a CNB team and for each repository will be allow to:

- reviewing, approving, and merging pull requests.
- planning release milestones, and releasing components versions
- edit, label, assign issues

An updated version of the previous diagram shows graphically this new role.

![](https://i.imgur.com/rWElkCw.png)

As we can see a new orange box was drawn representing a component, or group of software components, the new **component maintainer** role is taking responsibilities for. When a team lead or maintainer wants to use the role in their team, they must follow these steps:

- In case it doesn't exist, a new **github team** must be created. A recommended name for this new team must follows the format `[cnb-team]-[component]-maintainers`, where:
  - **cnb-team**: is the CNB team responsible for the software component, for example: `Platform Team`.
  - **component**: is the software component name. for example: `kpack`.

  Some examples are: `platform-kpack-maintainers` or `platform-cosign-maintainers`

- For each repository related to the component or group of components:
  - In case it doesn't exist, a new **CODEOWNERS** file must be added.
  - Add the team `[cnb-team]-[component]-maintainers` created into the **CODEOWNERS** file.
  - Members of the team should have maintainers permissions.
  - The branch protection should require **CODEOWNERS** to approve or merge a pull request.

- Add the new component maintainer's github account into the `[cnb-team]-[component]-maintainers` **github team**.

### Examples

Let's come back to our previous examples.

#### Platform Team

In these cases, the existence of the **component maintainer** role will provide the rules to the platform team lead or platform maintainers to nominate (following the guidelines describe in the next section) a **component maintainer**.

##### Integration with the Cloud Native Ecosystem

In case [kpack](https://github.com/pivotal/kpack) is donated to CNB, [kpack](https://github.com/pivotal/kpack) maintainers could become **component maintainers** of this component and keep doing all the activities required for maintaining the lights on in the project without having to assume the whole set of responsibilities of a Platform team maintainer. Also, platform maintainers will not be overwhelm being the sole reviewers/approvers for [kpack's](https://github.com/pivotal/kpack) pull requests if they are not familiar with the project.  

##### Adding Cosign integration

The existence of the **component maintainer** will open the door to the community, in particular, those volunteers with experience on [sigstore](https://www.sigstore.dev/) to help on with the contributions and maintenance of the new `signer` binary proposed.

This case, is an example of two different areas of interest or knowledge where having the separation of responsibilities is relevant.

## Guidelines nominate component maintainer

Follow this guideline to nominate a **component maintainer** for a software component inside a team

- The software component must be defined under the [GOVERNANCE](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md) team section, for example: Platform Team -> kpack
- New **component maintainers** must already be contributors of the team
- New **component maintainers** must be nominate by a **team lead** or a **maintainer** of the team under the following scenarios:  
  - A software component developed outside CNB project was [accepted](https://github.com/buildpacks/community/blob/main/contributors/guide.md#component) under their team and they do not have the know-how or experience to handle it.
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
