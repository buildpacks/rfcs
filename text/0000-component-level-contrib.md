# Meta
[meta]: #meta
- Name: Guidelines for Component-level Contributions
- Start Date: 2021-03-08
- Author(s): @sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A


# Motivation
[motivation]: #motivation

Our current contribution guidelines do not define a process for accepting component-level contributios, such as existing git repositories, that were developed outside of the project.
While the lack of guidelines has not prevented components from being contributed (e.g., #123), establishing formal guidelines will ensure fair and orderly consideration of future proposals.

# Proposed Guidelines
[proposed-guidelines]: #proposed-guidelines

- Component-level contributions must be proposed as project-wide RFCs
- Proposed contributions must primarily support the goals and use cases of the project and may not contain unrelated functionality that would not otherwise be accepted via the RFC process.
  - Qualifying examples:
    1. A Github Action that performs buildpack builds
    2. A Concourse resource that creates builder images
    3. A v2 Heroku buildpack that runs Cloud Native Buildpack (v3) builds on platforms that only support older v2 buildpacks.
  - Non-qualifying examples:
    1. A generic CI/CD tool that includes functionality to run buildpack builds, but primarily supports use cases outside of the project (e.g., Tekton)
- If a proposed contribution provides functionality that is already provided by the project, such functionality must be provided for use in a non-overlapping context, or the proposal must include a plan for consolidation.
  - Qualifying examples:
    1. Buildpack language bindings for a language other than Go
    2. An alternative implementation of the buildpack lifecycle launcher in Rust, with a documented plan to deprecate the original Go version
  - Non-qualifying examples:
    1. An alternative implementation of the lifecycle in Rust that would exist concurrently with the Go version in perpetuity
- If a proposed contribution is an adapter or integration with another service or technology, that technology must be notable and/or widely used (at the Core Team’s discretion). 
- If a component is proposed for donation by one or more Core Team members individually, those Core Team members must abstain from voting over its acceptance.
- If a component is proposed for donation by one or more Core Team members’ employer or employers, those Core Team members must abstain from voting over its acceptance.


# Drawbacks
[drawbacks]: #drawbacks

- Accepted guidelines may be too rigid and exclude components that the project should accept
- Accepted guidelines may not be rigid enough, and the project may feel pressured to accept components that are inappropriate

# Alternatives
[alternatives]: #alternatives

- Do not establish guidelines for component-level contributions


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- None so far.
