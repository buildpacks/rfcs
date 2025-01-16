# Meta

[meta]: #meta

- Name: ArtifactHub.io Integration
- Start Date: 2024-01-16
- Author(s): @joeybrown-sf
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary

[summary]: #summary

This RFC proposes that we integrate and augment our bespoke registry service
with [ArtifactHub.io](https://artifacthub.io/). This RFC does not stipulate that we _remove_ or _replace_ our existing
registry. ArtifactHub.io is a public instance of the [ArtifactHub](https://github.com/artifacthub/hub) project, and we
do not plan for ArtifactHub to outright replace our current registry service.

This is an augmentation, not a replacement. It will not affect how Images are built--this is a tool for artifact
discoverability for human consumption.

# Definitions

[definitions]: #definitions

### [ArtifactHub](https://github.com/artifacthub/hub)

A CNCF project that is a web-based application that enables finding, installing, and publishing Cloud Native packages.

### [ArtifactHub.io](https://artifacthub.io/)

An instance of the ArtifactHub project that is hosted with CNFC resources and maintained by ArtifactHub project
maintainers.

### [OCI (or Cloud Native) Artifact](https://opencontainers.org/posts/blog/2024-03-13-image-and-distribution-1-1/#artifacts)

Package of distributable binary files that use the same general format as OCI Images. Manifests, layers/blobs, etc.

### [Artifact Kind](https://github.com/artifacthub/hub/blob/5a5a556006014c1d6d795f8a103d6f0de2b298e6/internal/hub/repo.go#L46)

Artifacts that ArtifactHub knows about. ArtifactHub supports over 20 types of Cloud Native artifacts, including Argo
Templates, Backstage Plugins, Helm Charts, etc. The three artifacts kinds considered in this proposal are _Component
Buildpacks_, _Builders_, and _Base Run Images_.

# Motivation

[motivation]: #motivation

Buildpacks, Builders, and Run Images should be easily discoverable to make them more usable and approachable. Today, the
centralized [buildpacks registry](https://registry.buildpacks.io/) service is our solution to discoverability. This
registry service is a very important tool, but there is room for improvement.

The mission of CNB is to enable **building**. Making artifacts discoverable is not necessarily part of the core mission,
but it is a core supporting feature. Meanwhile, OCI artifact discoverability **is the core mission** of ArtifactHub.io.
We should consider using this "off the shelf" product instead of enhancing our own registry. In this way, we can support
the CNCF community while gaining a lot of features and dedicated user experience enhancements. We will benefit from
contributors dedicated to artifact discoverability.

Here is an [example of a helm chart](https://artifacthub.io/packages/helm/prometheus-community/prometheus) that is
referenced on ArtifactHub.io. You can see here there are a lot of interesting features like security reports,
vulnerabilities, usage stats, and all sorts of things.

Now is a great time to interface with the ArtifactHub team. Buildpacks is very stable and ArtifactHub appears relatively
stable as well.

# What it is

With (not insignificant) effort on our part, we could gain a lot of benefits from cooperating and integrating with
ArtifactHub. For instance, ArtifactHub would provide us with a more extensive API, we can have data that signals to
consumers which buildpacks are verified or officially supported by organizations, etc. We could have better navigation
of Builders to Buildpacks and Run Images and even more metadata that would support buildpack adoption and signal CNB
project maturity.

# How it Works

The ArtifactHub [roadmap](https://github.com/artifacthub/hub/blob/master/ROADMAP.md) outlines the direction of the
project, which includes adding "support for more Cloud
Native artifacts from CNCF projects." We should work with the ArtifactHub team to connect our registry and
make the following Images/Artifacts first-class citizens in ArtifactHub:

- CNB Component Buildpacks
- CNB Builders
- CNB Base Run Images

# Migration

[migration]: #migration

There will not be a migration because we will not remove the existing registry.

The official buildpacks registry is the [registry-index found at github](https://github.com/buildpacks/registry-index).
This is the registry used by pack when it is identifying buildpacks referenced with the URN pattern of
`urn:cnb:builder[:<id>[@<version>]]` or
`urn:cnb:registry[:<id>[@<version>]]` ([ref](https://buildpacks.io/docs/for-app-developers/how-to/build-inputs/specify-buildpacks/)).
This will remain in place.

# Drawbacks

[drawbacks]: #drawbacks

We would need to consider changes to the ArtifactHub type schemas when modifying our spec. It is possible that the
Artifact Hub artifact schemas and API could drift from the official RFC speec and implementation. We would need to
consider backwards compatibility with the ArtifactHub implementation.

# Alternatives

[alternatives]: #alternatives

### Do Nothing

We could leave our discoverability story alone and maintain our current implementation.

### Invest in our own registry

We Enhance our own registry to make things more discoverable. This would involve significant effort and UI/UX design
skill.

# Prior Art

[prior-art]: #prior-art

Our bespoke registry is functional and does what it's designed to do. This registry is composed of the following
projects:

- [registry-namespaces](https://github.com/buildpacks/registry-namespaces)
- [registry-api](https://github.com/buildpacks/registry-api)
- [registry-index](https://github.com/buildpacks/registry-index)

# Unresolved Questions

[unresolved-questions]: #unresolved-questions

Is there a Buildpacks team that owns the Registry Service now? Are they willing to take on the burden of owning this? If
not, we should probably make sure this has ownership.

# Spec. Changes (OPTIONAL)

[spec-changes]: #spec-changes
There are no spec changes at this time, but during implementation we may find it beneficial or necessary to add
metatdata.

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