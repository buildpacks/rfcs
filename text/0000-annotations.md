# Meta
[meta]: #meta
- Name: OCI Image annotations
- Start Date: 2021-12-03
- Author(s): [@samj1912](https://github.com/samj1912)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Add OCI recommended image annotations to output images.

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

Certain OCI image scanning and debugging tools take into account standard annotations on the images as defined by [OCI Spec - Pre-defined Annotation keys](https://github.com/opencontainers/image-spec/blob/main/annotations.md#pre-defined-annotation-keys). Buildpacks already records some of this information in the `project.toml` and other labels defined at https://github.com/buildpacks/spec/blob/main/platform.md#labels. We should also preserve this information in the output image in appropriate annotations as recommended by the OCI spec.

# What it is
[what-it-is]: #what-it-is

Adds OCI recommended annotations to the output image.

# How it Works
[how-it-works]: #how-it-works

Optionally adds the following annotations where applicable when lifecycle is used to publish images directly to the registry - 

- `org.opencontainers.image.base.name`: Run image tag name. Currently stored in `io.buildpacks.lifecycle.metadata.run-image.reference`
- `org.opencontainers.image.base.digest`: Run image digest. Currently stored in `io.buildpacks.lifecycle.metadata.run-image.reference`

The platform may also provide appropriate keys inside `project-metadata.toml` to the lifecycle so that it exports the appropriate annotations listed below.

- `org.opencontainers.image.source`: URL to the image source if the source is a source controlled repository, URL to a blob etc. Sourced from `source.metadata.repository`.
- `org.opencontainers.image.revision`: Source controlled revision of application source code. Sourced from `source.version.commit`.
- `org.opencontainers.image.authors`: Authors of hte image. Sourced from `source.metadata.authors`.
- `org.opencontainers.image.version`: Authors of hte image. Sourced from `source.metadata.version`.
- `org.opencontainers.image.documentation`: URL to find more information on the image. Sourced from `source.metadata.documentation-url`.
- `org.opencontainers.image.title`: Human-readable title of the image. Sourced from `source.metadata.name`.
- `org.opencontainers.image.licenses`: License(s) under which contained software is distributed as an SPDX License Expression. Sourced from `source.metadata.licenses`.

A platform may choose to map the above fields to the fields defined in a project descriptor as noted at https://github.com/buildpacks/spec/blob/extensions/project-descriptor%2F0.2/extensions/project-descriptor.md#non-_-tables.

Everything under `source.metadata.<key>` is mapped from `_.<key>` from the project descriptor in this case.

# Drawbacks
[drawbacks]: #drawbacks

In case of the daemon mode, the annotations cannot be applied and will be ignored.

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

- https://github.com/buildpacks/rfcs/blob/main/text/0054-project-descriptor-schema.md
- https://github.com/buildpacks/rfcs/blob/main/text/0084-project-descriptor-domains.md

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Per above.