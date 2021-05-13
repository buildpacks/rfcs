# Meta
[meta]: #meta
- Name: Buildpacks Author Sub-Team
- Start Date: 2021-05-11
- Author(s): [@ekcasey](https://github.com/ekcasey), [@hone](https://github.com/hone), [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes the creation of a "Buildpacks Author" sub-team in the project governance with a charter of maintaining buildpack author tooling for creating buildpacks.

# Definitions
[definitions]: #definitions

- *sub-team* - Sub-teams are responsible for narrower sets of concerns related to specific aspects of the project. Each sub-team will include at least one core team member to help align with the broader roadmap.
- *Buildpack API* - The API Cloud Native buildpacks must implement in order to participate in a build.
- *Language bindings* - A library that provides language specific constructs to make interaction with the buildpack API easier.
- *[`libcnb`](https://github.com/buildpacks/libcnb)* - Go language bindings for the Buildpack API.
- *[`lifecycle`](https://github.com/buildpacks/lifecycle)* - A reference implementation of the Cloud Native Buildpacks specification.

# Motivation
[motivation]: #motivation

Buildpack author focused tooling like `libcnb` or buildpack onboarding with `pack buildpack new` is scattered throughout various sub-teams. `libcnb` is currently under the purview of the implementation team, however historically, the majority of the efforts of the implementation team have been focused on maintaining the lifecycle. The set of contributors with the most experience authoring buildpack and the set of contributors with the most experience working with the lifecycle have little overlap.

As such, `libcnb` currently doesn't have well-defined processes around how it should be maintained and improved upon in order to increase adoption or serve the needs of existing users.  This leads to it feeling like an afterthought even though it is the only "official" language binding provided by the project. This lack of process hasn't stopped a [reasonable number](https://pkg.go.dev/github.com/buildpacks/libcnb?tab=importedby) of buildpack implementations from using it.

Also, our user research has indicated that authoring a buildpack is difficult, and many potential buildpack authors are not go developers. In order to grow the number of buildpack authors there needs to be alternative language bindings whether provided by the project or fostered from the community:

- [python](https://github.com/samj1912/python-libcnb)
- [bash](https://github.com/jkutner/libcnb.bash)
- [rust](https://github.com/Malax/libcnb)
- [community go alternative](https://github.com/paketo-buildpacks/packit)

Ultimately, there needs to be a group of people focused on addressing this need of making buildpack authorship more approachable.

# What it is
[what-it-is]: #what-it-is

The high level charter of the proposed Buildpack Authors subteams is to help buildpack authors create buildpacks.

More concretely the sub-team  would serve the following goals:
1. Create a community focused on the needs of buildpack authors.
1. Advocate for Buildpack Author needs from the community throughout the project
1. Devote attention to improving our existing buildpack-author tooling (`libcnb`).
1. Provide a home for any future buildpack author tooling (testing buildpacks and language buildpack templates).
1. Encourage buildpack authors to get more involved in and contribute to the project by creating a team exclusively focused on building more shared tooling for buildpack authors.

# How it Works
[how-it-works]: #how-it-works

## Sub-team Guidelines

The Buildpack Author sub-team will follow the same guidelines as other sub-teams:

- include at least one core team member
- responsible for narrower sets of concerns related to specific aspects of the project

## Language Binding Responsibilties
These are the responsibilities for maintaining any language binding:
1. Implementing new APIs in a timely manner
1. Release process, planning and updates
1. Triaging issues and supporting users
1. Documentation
1. Buildpack Examples using these bindings
1. Planning and executing improvements

Today, this means taking ownership over the `libcnb` repo doing the above for it.

## Inline Buildpack Responsibilites
The buildpack sub-team is responsible for sheparding and maintaining [Inline Buildpacks](https://github.com/buildpacks/rfcs/blob/main/text/0048-inline-buildpack.md).

## Collaboration with other teams
The buildpack sub-team should engage with the learning team in order to:
1. Improve documentation for buildpack authors
1. Document buildpack best practices

The buildpack sub-team should provide feedback on RFCs that change the buildpack API with an eye to the potential implications for buildpack authors.

## Future Scope
The following are examples of additional tools that would fall to the purview of the buildpack team:
1. Language bindings for other languages
1. Project Templates for bootstrapping buildpacks
1. A test harness for integration testing buildpacks
1. A DSL for writing buildpacks (e.g. [packfile](https://github.com/sclevine/packfile) or similar)

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Yet another sub-team
- May be difficult to sustain maintainers for all these teams
- May create a silo instead of spreading out the buildpack author concerns

# Alternatives
[alternatives]: #alternatives

## Do Nothing

If this team isn't made, `libcnb` will continue to live in the implementation team. That sub-team can then staff more focused contributors/maintainers for maintaing that library. Each other "Buildpack Author" focused project/tool will need to find an appropriate home. This will fragment and hurt the focus of having a single team built around it.

## Distribution Team

The distribution team already handles a part of the Buildpack Author experience which is publishing a buildpack and is currently a fairly small team. This would let the two sub-teams combine with expanded scope. This isn't a perfect match though, since the distribution team is well scoped at this point focusing on the registry, interacting with it as users, and operating it.

# Prior Art
[prior-art]: #prior-art

* [Rust Dev tools team](https://www.rust-lang.org/governance/teams/dev-tools)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Who are the maintainers?
- Would this sub-team own the pack buildpack author tooling (like `pack buildpack new` and inline buildpacks)?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
None
