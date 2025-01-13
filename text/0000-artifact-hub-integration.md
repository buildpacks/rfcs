# Meta
[meta]: #meta
- Name: ArtifactHub.io Integration
- Start Date: 2024-11-18
- Author(s): @joeybrown-sf
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The core mission of Cloud Native Buildpacks is to commoditize building and maintaining OCI Images. As a means of achieving this goal, we have established a [centralized registry service](https://registry.buildpacks.io/) that helps with discoverability and usage. This registry service is _not_ part of the core mission of CNBs, but is very important for tooling and consumption.

[ArtifactHub](https://github.com/artifacthub/hub) is a "web-based application that enables finding, installing, and publishing Cloud Native packages." It entered CNFC [incubation](https://www.cncf.io/blog/2024/09/17/artifact-hub-becomes-a-cncf-incubating-project/) on 2024-09-27. The ArtifactHub [roadmap](https://github.com/artifacthub/hub/blob/master/ROADMAP.md) outlines the direction of the project, which includes adding "support for more Cloud Native artifacts from CNCF projects."

This RFC proposes we phase out our bespoke registry service and replace it with ArtifactHub. This includes working with the ArtifactHub team to support two new artifacts: CNB Component Buildpacks & CNB Builders.

# Definitions
[definitions]: #definitions

### ArtifactHub
A CNCF project that is a web-based application that enables finding, installing, and publishing Cloud Native packages.

### ArtifactHub.io
An instance of the ArtifactHub project that is hosted with CNFC resources and maintained by ArtifactHub project maintainers.

### OCI (or Cloud Native) Artifact
Package of distributable binary files that use the same general format as OCI Images. Manifests, layers/blobs, etc.

### Artifact Type
Objects that ArtifactHub knows about.

ArtifactHub supports over 20 types of Cloud Native artifacts, including Argo Templates, Backstage Plugins, Helm Charts, etc.

The two artifacts considered in this proposal are _Builder_ & _Component Buildpack_.

# Motivation
[motivation]: #motivation

The Buildpack Registry is lacking in functionality. We can invest in enhancing our own implementation that will support only our project, or we could adapt and adopt a project that concentrates this effort and will benefit from a wider pool of contributors.

With (not insignificant) effort on our part, we could gain a lot of benefits from cooperating with ArtifactHub. For instance, ArtifactHub would provide us with a more extensive API, we can have data that signals to consumers which buildpacks are verified or officially supported by organizations, etc. We could have better navigation of Builders to Buildpacks and even more metadata that would support adoption and signal CNB project maturity.

Here is an [example of a helm chart](https://artifacthub.io/packages/helm/prometheus-community/prometheus) that is referenced on ArtifactHub.io. You can see here there are a lot of interesting features like security reports, vulnerabilities, usage stats, and all sorts of things.

Now is a great time to interface with the ArtifactHub team. Buildpacks is very stable and ArtifactHub appears relatively stable as well.

# What it is
[what-it-is]: #what-it-is

`todo`

# How it Works
[how-it-works]: #how-it-works

`todo`

# Migration
[migration]: #migration

The official buildpacks registry is the [registry-index found at github](https://github.com/buildpacks/registry-index). This is the registry used by pack when it is identifying buildpacks referenced with the URN pattern of `urn:cnb:builder[:<id>[@<version>]]` or `urn:cnb:registry[:<id>[@<version>]]` ([ref](https://buildpacks.io/docs/for-app-developers/how-to/build-inputs/specify-buildpacks/)).





# Drawbacks
[drawbacks]: #drawbacks

This would likely couple our spec, metadata more tightly with ArtifactHub. We may need to consider changes to the ArtifactHub Builder & Component Buildpack type schemas when modifying our spec.

# Alternatives
[alternatives]: #alternatives

Enhance our own registry and make things more discoverable.

# Prior Art
[prior-art]: #prior-art

Our bespoke registry is functional and does what it's designed to do. This registry is composed of the following projects:
- [registry-namespaces](https://github.com/buildpacks/registry-namespaces)
- [registry-api](https://github.com/buildpacks/registry-api)
- [registry-index](https://github.com/buildpacks/registry-index)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

`todo`

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.

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