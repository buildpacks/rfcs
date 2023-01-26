# Meta
[meta]: #meta
- Name: Buildpacks Community
- Start Date: 2023-01-26
- Author(s): [@samj1912](https://github.com/samj1912)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The Buildpacks Community is a vendor-neutral Github organization where trusted community provided Cloud Native Buildpacks tooling, platforms and integrations can live. This would provide users a trusted place to search for Buildpack integrations maintained by the community.


# Definitions
[definitions]: #definitions

- **Buildpacks Community** - The Buildpacks Community is a vendor-neutral Github organization where trusted community provided Cloud Native Buildpacks tooling, platforms and integrations can live.
- **Buildpacks Leadership** - The Buildpacks Leadership is a group of trusted individuals who are responsible for the Buildpacks Community. They have the ability to create repositories in the Buildpacks Community and approve new projects to be added to the Buildpacks Community. This will consist of the TOC and Team-leads of the Buildpacks project.
- **Buildpacks TOC** - The Buildpacks TOC is the technical oversight committee for the Buildpacks project. The TOC is responsible for the technical direction of the Buildpacks project.


# Motivation
[motivation]: #motivation

There are two reasons why this community should exist.

- The Buildpacks Community will allow for the testing of new technologies or the development of integrations in an environment that is more flexible than that of the core Buildpacks organization. This will provide a staging area for integrations that the Buildpacks team deems important but we are not yet ready to commit to long term maintanance.

- A trusted repository of community integrations will also allow for a trusted source of integrations that solve common yet still relatively niche problems that are not suitable to be added to core Buildpacks organization. This will highlight integrations of high-quality and provide a vendor-neutral umbrella for them to live. They will also benefit from improved CI/CD resources and a common governance model.

# What it is
[what-it-is]: #what-it-is

<!-- 
This provides a high level overview of the feature.

- Define any new terminology.
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
- Explaining the feature largely in terms of examples.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing users and new users. -->

For a project to be admitted to the Buildpacks community organization, it must meet the following criteria:

- The project must be a tooling, platform or integration that is related to Cloud Native Buildpacks.
- The project must be open source and licensed under Apache 2.0.
- It must follow the Cloud Native Computing Foundation Code of Conduct.
- The project must enable DCO signoff for all commits.
- The project must be open to contributions and have a public issue tracker.
- The project must have a governance document that clearly defines the project maintainers and how they are elected. Each project may choose to define their own governance model as long as it is clearly documented and allows for project maintainers to be elected from the community.
- The list of project maintainers must be publicly available and controlled through a Github team.
- The project must use a CODEOWNERS file to define the maintainers for each repository. The CODEOWNERS file should reference the Github team that controls the list of maintainers.
- All project contributors must be members of the Buildpacks community organization.
- The project must be actively maintained (i.e. issues and pull requests must be addressed regularly, approved pull requests must be merged or updated in a timely manner, etc.).
- There should have visible automated testing for all repositories that are part of the project.
- The project maintainers must conform to a set of best effort SLOs around patching critical CVEs when applicable to the project.
- The project should strive have the following community health files:
  - CONTRIBUTING.md: A guide to how contributors should submit patches and the expectations around code review.
  - DEVELOPMENT.md: A guide to how contributors should develop the project.
  - ADOPTERS.md: A list of adopters of the project.
  - VERSIONING.md: A guide to how versioning is done for the project.
  - RELEASE.md: A guide to how releases are done for the project.
  - SECURITY.md: A guide to how security vulnerabilities should be reported.

This criteria is meant to alleviate the following problems:

- All projects must meet some testing standard to be trusted in order to ensure that the projects support the latest Buildpacks APIs and are actively maintained.
- All projects must have a clearly defined governance model to ensure that the project maintainers are elected from the community and that the project is open to contributions.
- There must be a defined system in place to reap abandonware.
- If a project maintainers are not making a best effort of patching out or updating vulnerable software then the project as a whole is untrustworthy.


# How it Works
[how-it-works]: #how-it-works

## Project Admission

A project can be admitted to the Buildpacks community organization by creating a Github issue in the Buildpacks community repository. The issue should contain the following information:

- Name of the project
- Evidence for the above criteria
- A list of maintainers for the project

The above information will be structured into an appropriate issue template. The Buildpacks Leadership will review the issue and if the project meets the above criteria, the project will be added to the Buildpacks community organization. The Buildpacks Leadership will assign a steward team to the project and the team lead of the steward team will be responsible for ensuring that the project meets the above criteria.

Once admitted, the team lead of the steward team will create a Github team for the project and add the project maintainers to the team and mark them as the team maintainers allowing them to add other maintainers. The existing team maintainers of the steward team will be added as maintainers to the project team.

The team lead will also create a CODEOWNERS file for the project and add the project maintainers as the code owners.

The project maintainers will be responsible for maintaining the list of project maintainers and ensuring that all project contributors are members of the Buildpacks community organization. 

They will be able to add new Github members to the organization by creating a Github issue in the Buildpacks community [invites repository](https://github.com/buildpacks-community/invites).

## Project Removal

In case the project fails to meet the above criteria, the Buildpacks Leadership will work with the project maintainers to address the issues and if the project is still not ready, the project will be archived or removed from the Buildpacks community organization.

## Project Graduation

In case a project is deemed to be mature enough to be part of the core Buildpacks organization, the project maintainers can request for the project to be graduated to the core Buildpacks organization via the [Component Contribution RFC](https://github.com/buildpacks/rfcs/blob/main/text/0108-governance-component-maintainer-role.md). The Buildpacks TOC will review the request and if the project meets the criteria for graduation, the project will be moved to the core Buildpacks organization.


# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks


N/A

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

- [CNCF Sandbox](https://www.cncf.io/sandbox-projects/)
- [Paketo Community](https://github.com/paketo-buildpacks/rfcs/blob/main/text/0008-paketo-community.md)
- [Argoproj Labs](https://github.com/argoproj-labs)
- [Crossplane Contrib](https://github.com/crossplane-contrib)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- The exact project onboarding issue template.

# History
[history]: #history


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
