# Meta
[meta]: #meta
- Name: OCI Image Annotations on Buildpacks
- Start Date: 2024-06-26
- Author(s): @candrews
- Status: Approved
- RFC Pull Request: [rfcs#314](https://github.com/buildpacks/rfcs/pull/314)
- CNB Pull Request: (leave blank)
- CNB Issue: https://github.com/buildpacks/rfcs/issues/318
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The `pack` tool should set OCI annotations on the OCI artifacts it produces providing users of these buildpacks with a consistent, standard mechanism for gathering information about the buildpack, including how to find its documentation and what version it is. The annotation values can be gathered from existing data sources (such as `buildpack.toml`) therefore not requiring any additional effort on the part of users of the `pack` tool.

# Definitions
[definitions]: #definitions

[Buildpacks](https://buildpacks.io/docs/for-app-developers/concepts/buildpack/) are [OCI images](https://github.com/opencontainers/image-spec/blob/v1.1.0/README.md). [Annotations](https://github.com/opencontainers/image-spec/blob/v1.1.0/annotations.md) are optional properties that can be applies to image manifests and descriptions providing mechanism to communicate metadata. The [Pre-Defined Annotation Keys](https://github.com/opencontainers/image-spec/blob/v1.1.0/annotations.md#pre-defined-annotation-keys) are a standardized set of annotations that can be used to convey metadata in a consistent way between image authors and users.

# Motivation
[motivation]: #motivation

Knowing the origin and other metadata for a buildpack (which is an OCI image) is very helpful. Some examples of such use cases include finding release notes, user manuals, bug reporting procedures, and license information. Currently, it can be difficult to find the source control repository of a buildpack as that information is not available in a standard way.

The OCI Image Format Specification's Pre-Defined Annotation Keys provide a standardized way to discover additional information about an OCI image. Because these annotations are standardized and widely used, tools have come to use them. For example, [Snyk](https://snyk.io/blog/how-and-when-to-use-docker-labels-oci-container-annotations/) and [Renovate](https://github.com/renovatebot/renovate/blob/34.115.1/lib/modules/datasource/docker/readme.md) use these annotations.

The outcome will be that users and tools will be able to gather more information about buildpacks, facilitating use cases such as gathering releases notes and finding documentation.

# What it is
[what-it-is]: #what-it-is

`pack buildpack package` should set the following OCI annotations on the images it produces:

- `org.opencontainers.image.source` (when possible)
- `org.opencontainers.image.revision` (when possible)
- `org.opencontainers.image.title`
- `org.opencontainers.image.version`
- `org.opencontainers.image.url` (when possible)
- `org.opencontainers.image.description` (when possible)

The target personas as buildpack users, platform operators, and platform implementers. Any of those groups will be able to more easily understand the origin (source), version, and other information about the buildpack. This information can then be used manually or with the aid of tools to get release notes which aid these personas in making informed decisions.

# How it Works
[how-it-works]: #how-it-works

When packaging the buildpack, the `pack` tool can get the values for the `org.opencontainers.image.source` and `org.opencontainers.image.revision` annotations from git. `org.opencontainers.image.source` is derived from the git origin and `org.opencontainers.image.revision` is the git commit hash.

The other annotation values come from `buildpack.toml` mapped to OCI annotations as follows:

- `name` -> `org.opencontainers.image.title`
- `version` -> `org.opencontainers.image.version`
- `homepage` (optional) -> `org.opencontainers.image.url`
- `description` (optional) -> `org.opencontainers.image.description`

The following example values are from [Paketo Buildpack for Java 13.0.1](https://github.com/paketo-buildpacks/java/releases/tag/v13.0.1):

- `org.opencontainers.image.source`: https://github.com/paketo-buildpacks/java
- `org.opencontainers.image.revision`: 09747b1df0a56aea74ce9b01af89df6feb1fc50a
- `org.opencontainers.image.title`: Paketo Buildpack for Java
- `org.opencontainers.image.version`: 13.0.1
- `org.opencontainers.image.url`: https://paketo.io/docs/howto/java
- `org.opencontainers.image.description`: A Cloud Native Buildpack with an order definition suitable for Java applications

# Migration
[migration]: #migration

The `pack` tool would be modified to set the annotations. Because the tool _should_ set these annotations (not _must_ set), buildpacks created with earlier versions of the tool are still considered to be valid in accordance with the distribution specification.

# Drawbacks
[drawbacks]: #drawbacks

N/A

# Alternatives
[alternatives]: #alternatives

Instead of standardizing the use of these annotations across all buildpacks, each buildpack could add the annotations individually. However, that approach has significant consistency and maintainability concerns. Standardizing the annotations and implementing them consistently across all buildpacks minimizes risk and maximizes utility. If this approach is not done, users will continue to be unable to use tools to gather buildpack information, and gathering that information manually will continue to be difficult or impossible.

# Prior Art
[prior-art]: #prior-art

Many images are setting OCI image annotations with adoption continually on the rise.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

The [distribution spec](https://github.com/buildpacks/spec/blob/main/distribution.md) would be updated to document the OCI image annotations as covered in ["How it Works"](#how-it-works).


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