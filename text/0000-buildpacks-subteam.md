# Meta
[meta]: #meta
- Name: Buildpacks Sub-Team
- Start Date: 2021-05-11
- Author(s): @ekcasey
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes the creation of a Buildpacks sub-team in the project governance.

# Definitions
[definitions]: #definitions

- *sub-team* - Sub-teams are responsible for narrower sets of concerns related to specific aspects of the project. Each sub-team will include at least one core team member to help align with the broader roadmap.
- *Buildpack API* - The API Cloud Native buildpacks must implement in order to participate in a build.
- *libcnb* - Go language bindings for the Buildpack API.

# Motivation
[motivation]: #motivation

The proposed buildpack sub-team would serve the following goals:
1. Create a community focused on the needs of buildpack authors.
2. Devote attention to improving our existing buildpack-author tooling (`libcnb`).
3. Provide a home for any future buildpack author tooling.
4. Encourage buildpack authors to get more involved in and contribute the project by creating a team exclusively focused on building more shared tooling for buildpack authors.

Despite the fact that many buildpack implementations are written in golang and [reasonable number](https://pkg.go.dev/github.com/buildpacks/libcnb?tab=importedby) of these implementation use `libcnb` we rarely discuss how `libcnb` could be improved in order to increase adoption or better serve the needs of existing users. A team explicitly chartered to improve buildpack author tooling could address this gap.

Also, our user research has indicated that authoring a buildpack is difficult, and many potential buildpack authors are not go developers. A buildpack sub-team could focus on providing tools targeting those users with the aim of making buildpack authorship more approachable.

The implementation team is currently responsible for libcnb. However this team is largely focused on the lifecycle. The set of contributors with the most experience authoring buildpack and the set of contributors with the most experience working with the lifecycle have little overlap. Therefore, creating a new team makes more sense than encouraging the existing implementation maintainers to increase their attention to libcnb.

# What it is
[what-it-is]: #what-it-is



# How it Works
[how-it-works]: #how-it-works

## `libcnb` Responsibilties
The buildpack sub-team would given responsibility for `libcnb`, including:
1. Implementing new APIs in a timely manner
2. Release process, planning and updates
3. Triaging issues and supporting users
4. Documentation
5. Planning and executing improvements

## Collaboration with other teams
The buildpack sub-team should engage with the learning team in order to:
 1. Improve documentation for buildpack authors
 2. Document buildpack best practices

The buildpack sub-team should provide feedback on RFCs that change the buildpack API with an eye to the potential implications for buildpack authors.

## Future Scope
The following are examples of additional tools that would fall to the purview of the buildpack team:
1. Language bindings for other languages
2. A test harness for integration testing buildpacks
3. A DSL for writing buildpacks (e.g. [packfile](https://github.com/sclevine/packfile) or similar)

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.
