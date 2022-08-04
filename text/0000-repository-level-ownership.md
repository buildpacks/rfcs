# Meta
[meta]: #meta
- Name: Repository Level Ownership
- Start Date: 2022-04-14
- Author(s): @jromero, @jjbustamante
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes:

# Summary
[summary]: #summary

Migrate to using `CODEOWNERS` files to identify repository ownership across the entire project.

# Definitions
[definitions]: #definitions

- teams: Group of individuals focused on narrower sets of concerns related to specific aspects of the project. Example: implementation team, platform team.
- maintainers: Individuals that maintain specific code repositories.

# Motivation
[motivation]: #motivation

The current maintainer model is not ideal for contributors that want to focus on only a single component without taking on responsibilities for all other repositories. By attributing repositories to individual owners, teams can better manage lower-level ownership models.

As a consumer, it becomes easier to identify individuals responsible for each repository if the repository had a reference to the "owners" of the repository.

# What it is
[what-it-is]: #what-it-is

A `CODEOWNERS` file in each project repository that identifies individuals and/or teams responsible for the repository.

Individuals will be referenced by their GitHub username handle while teams would be reference by GitHub Team handles.

```CODEOWNERS
# GitHub team
* @buildpacks/platform-maintainers

# maintainers
* @jromero
```

# How it Works
[how-it-works]: #how-it-works

Each repository within the project will contain a `CODEOWNERS` file that lists owners for that particular repository. Each owner added into this file will inherit the following [maintainer's responsibilities](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#maintainers) over the repository:

- reviewing, approving, and merging PRs.
- planning release milestones, and releasing components under the team's area of responsibility.

By default, the `CODEOWNERS` file will have at least one GitHub team owner as a "fallback" in case any individuals are unreachable.

# Migration
[migration]: #migration

Currently all the CNB repositories already have the `CODEOWNERS` with the corresponding team added to it, there are not migrations steps required at the moment

# Drawbacks
[drawbacks]: #drawbacks

None

# Alternatives
[alternatives]: #alternatives

- Continue to expect ownership of repositories to be only at the team level.
- Use _custom_ `OWNERS` and `OWNER_ALIAS` files instead of relying on GitHub specific functionality/standards.
    - K8s does this:
      > "We use aliases for groups instead of GitHub Teams, because changes to GitHub Teams are not publicly auditable."

# Prior Art
[prior-art]: #prior-art

This RFC is inspired on the following approaches from the community:

- [K8s' OWNERS](https://www.kubernetes.dev/docs/guide/owners/)
- [Chromium's OWNERS](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/code_reviews.md#owners-files)
- [GitLab's CODEOWNERS](https://docs.gitlab.com/ee/user/project/code_owners.html#set-up-code-owners)

Also, it aligns with the governance changes describe at the [New RFC Process](https://github.com/buildpacks/rfcs/pull/218)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Do owners have to be team maintainers?
    - This question is out-of-scope of this RFC and would require a larger more impacting governance change and discussion.
- How are permissions handled?
    - At this point in time, it's proposed that maintainers and leads take the appropriate actions necessary to ensure parity. This can easily be automated once adopted.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A
