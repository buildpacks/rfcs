# Meta
[meta]: #meta
- Name: RFC Process
- Start Date: 2019-04-09
- CNB Pull Request: [rfcs#1](https://github.com/buildpack/rfcs/pull/1), [rfcs#7](https://github.com/buildpack/rfcs/pull/7)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The "RFC" (request for comments) process provide a consistent and controlled path for new features to enter the spec, libraries, or tools, so that all stakeholders can be confident about the direction Cloud Native Buildpacks is evolving in.

# Motivation
[motivation]: #motivation

Now that we've entered the beta and people are trying out Cloud Native Buildpacks in the wild, we need to take more care in introducing change. As part of the road to incubation, we need to demonstrate maturity and stability. This process documents a path for anyone to contribute and have input on features.

# What it is
[what-it-is]: #what-it-is

RFCs record potential change and with the context and information at the given time. This provides a defined process for anyone wishing to contribute to the Cloud Native Buildpacks project as well as collect a diverse set of inputs and give opportunity for engagement. Anyone who chooses not to actively partcipate in any RFC is presumed to trust their colleagues on the matter. Once an RFC is accepted, they can be referenced as read-only documents in this repository until replaced or ammended by another RFC when context has significantly changed.

# How it Works
[how-it-works]: #how-it-works

Many changes, including bug fixes and documentation improvements can be implemented and reviewed via the normal GitHub pull request workflow.

Some changes though are "substantial", and we ask that these be put through a bit of a design process and produce a consensus among the community and the core team / respective subteam.

## What's in Scope

You'll need to follow this process for anything considered "substantial". The things that we consider "substantial" will evolve over time, but will generally be user facing changes.

The Cloud Native Buildpacks project has 5 types of users:

- Buildpack Users - these are developers who want to go from source code to container image
- Buildpack Authors - these are developers who are building the buildpacks
- Platform Operator - these are the operators who will be running the buildpack infrastructure
- Platform Implementor - these are developers who will be implementing the buildpack infrastructure
- Project Contributor - people contributing to the Cloud Native Buildpacks project

What constitutes a "substantial" change may include the following but is not limited to:

- changes to the spec (buildpack author, platform operator)
- adding/removing pack commands (buildpack user, buildpack author)
- breaking changes to the lifecycle library interface such as the lifecycle/platform or lifecycle/platform contracts (platform implementor)
- process changes (project contributor)
- governance (project contributor)
- issues that need more discussion or clarification as determined by the project owners and maintainers

If you submit a pull request the team deems warrants an RFC, it will be politely closed with a request for an RFC.

## Process

### RFCs

To get an RFC into Cloud Native Buildpacks, first the RFC needs to be merged into the RFC repo. Once an RFC is merged, it's considered 'active' and may be implemented to be included in the project. These steps will get an RFC to be considered:

- Fork the RFC repo: <https://github.com/buildpack/rfcs>
- Copy `0000-template.md` to `text/0000-my-feature.md` (where 'my-feature' is descriptive. don't assign an RFC number yet).
- Fill in RFC. Any section can be marked as "N/A" if not applicable.
- Submit a pull request. The pull request is the time to get review of the proposal from the larger community.
- Build consensus and integrate feedback. RFCs that have broad support are much more likely to make progress than those that don't receive any comments.

Once a pull request is opened, the RFC is now in development and the following will happen:

- It will be labeled and discussed on a future working group meeting. Working group meetings happen on a weekly cadence barring exceptions. Labeling marks a RFC as general or specific to a subteam.
- The team will discuss as much as possible in the RFC pull request directly. Any outside discussion will be summarized in the comment thread.
- When deemed "ready", a team member will propose a "motion for final comment period (FCP)" along with a disposition of the outcome (merge, close, or postpone). This is step taken when enough discussion of the tradeoffs have taken place and the team is in a position to make a decision. Before entering FCP, super majority of the team must sign off.
- The FCP will last 7 days. If there's unanimous agreement among the team the FCP can close early.
- For voting, the binding votes are comprised of the core team (and subteam maintainers if labeled as a subteam RFC). Acceptance requires super majority of binding votes in favor. The voting options are the following: Affirmative, Negative, and Abstinence. Non-binding votes are of course welcome. Super majority means 2/3 or greater and no single company can have more than 50% of countable votes.
- If no substantial new arguments or ideas are raised, the FCP will follow the outcome decided. If there are substantial new arguments, then the RFC will go back into development.

Once an RFC has been accepted, the team member who merges the pull request should do the following:

- Assign an id based off the pull request number.
- Rename the file based off the id inside `text/`.
- Create a corresponding issue in the appropriate repo.
- Fill in the remaining metadata at the top.
- Commit everything.

### Pull Requests / Issues

During the Planning Working Group meeting, the team will go over open pull requests / issues. If the change is considered substantial or more clarity/discussion is warranted, the issue will be closed and the author will be asked to be opened.

# Drawbacks
[drawbacks]: #drawbacks

Though RFCs are intendend to be lightweight, this introduces extra process than what we're doing today. The additional work will need to be handled by the currently small core and subteams, which may make consistency hard.

# Alternatives
[alternatives]: #alternatives

- Stick with the current process, which is opening issues on pull requests/issues in the respective repos or the roadmaps repo. This makes it hard for new people to know where, how to propose changes, and how things are decided. The current process makes it hard to track major changes to the project.

# Prior Art
[prior-art]: #prior-art

The basic format of RFCs was [invented in the 1960s by Steve Crocker](https://en.wikipedia.org/wiki/Request_for_Comments#History). The current RFC process has been derived heavily from [Rust](https://rust-lang.github.io/rfcs/). Many other open source projects have adopted an RFC process:

- [Rust](https://github.com/rust-lang/rfcs)
  - FCP lasts 10 days
- [Ember](https://github.com/emberjs/rfcs)
  - FCP lasts 7 days
- [Yarn](https://github.com/yarnpkg/rfcs)
  - FCP lasts 7 days
- [React](https://github.com/reactjs/rfcs)
  - FCP lasts 3 days
- [IETF](https://www.rfc-editor.org/rfc/rfc2026.txt)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What clearly defines a "substantial" change?
- How long should the Final Comment Period be?
