# Meta
[meta]: #meta
- Name: Deprecate Bindings Extension Specification
- Start Date: 2020-08-06
- Author(s): @nebhale
- Status: Implemented
- RFC Pull Request: [rfcs#105](https://github.com/buildpacks/rfcs/pull/105)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Previously the Cloud Native Buildpacks project created a [Bindings Extension Specification][cnb].  This specification was intended to be an incubator for bindings generally and the hope was that it would be adopted by a broader ecosystem.  This has now come to pass with the [Service Binding Specification for Kubernetes][k8s].

Given this broader specification, the Cloud Native Buildpacks Bindings Extension Specification should be deprecated and eventually removed in favor of the Kubernetes version.

[cnb]: https://github.com/buildpacks/spec/blob/main/extensions/bindings.md
[k8s]: https://k8s-service-bindings.github.io/spec/

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

N/A

# What it is
[what-it-is]: #what-it-is

- The Specification should be clearly marked as deprecated with an anticipated removal date six months from its designation as deprecated.
- A reference to the Kubernetes specification should be added to the [Platform Additional Guidance Section][p].
- A reference to the Cloud Native Buildpacks specification with a warning that both should be supported during deprecation, should be added to the [Platform Additional Guidance Section][p].
- A reference to the Kubernetes specification should be added to a new [Buildpack Additional Guidance Secion][b].
- A reference to the Cloud Native Buildpacks specification with a warning that both should be supported during deprecation, should be added to a new [Buildpack Additional Guidance Secion][b].

[p]: https://github.com/buildpacks/spec/blob/main/platform.md#additional-guidance
[b]:

# How it Works
[how-it-works]: #how-it-works

N/A

# Drawbacks
[drawbacks]: #drawbacks

- Existing users of bindings will be affected.  Platforms and buildpacks should support both styles until the end of the deprecation period.

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should the deprecation period be different?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

See [What it is](#what-it-is)
