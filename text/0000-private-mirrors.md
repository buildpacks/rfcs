# Meta
[meta]: #meta
- Name: Private Registry Mirrors
- Start Date: 2023-05-12
- Author(s): @jabrown85
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

As a platform operator, we'd like to be able to configure a private registry mirror for the most popular public registries. This will help reduce dependency on the public registries during builds, reducing the overhead and complexity of dealing with external rate limits and other restrictions. This will also help reduce the risk of service interruptions and reduce the amount of public network traffic during builds.

# Definitions
[definitions]: #definitions

- Public Registry: A registry that is publicly accessible, such as Docker Hub, Quay.io, etc.
- Private Registry: A registry that is not publicly accessible, such as a registry hosted on a private network.
- Registry Mirror: A private registry that mirrors a public registry. This is typically used to reduce the amount of public network traffic and to reduce the risk of service interruptions. They are treated as a drop-in replacement for the public registry.

# Motivation
[motivation]: #motivation

- Why should we do this?
As a platform operator, we'd like to protect our Cloud Native Buildpack operations from rate limits and other service issues that may occur on public registries. While private mirrors are relatively easy to set up for k8s nodes workloads, it is difficult to configure Cloud Native Buildpacks to use them as images are requested while running inside `lifecycle` container processes. We'd like to be able to configure CNB to use a private mirror for the registries without affecting the resulting image.

Importantly, the presence of a mirror should be invisible outside of the platform. The resulting image should not contain any references to the mirror. This will allow the image to be used in any environment, regardless of whether the mirror is available. For example, the metadata set on the resulting image would reference the original registry URL, not the mirror URL. This will allow the resulting image to be used as if there was no mirror configured. This is important for future actions against the resulting image, such as `pack rebase` or `pack inspect`.

- What use cases does it support?
If a public registry was having service interruptions, an operator that had a previously configured mirror would be able to continue to build images without interruption.

If a public registry introduced lower rate limits, an operator that had a previously configured mirror would be able to continue to build images without interruption or fear of hitting the rate limit.

- What is the expected outcome?
Operators concerned with the reliability of their builds that use public images will be able to configure private registry mirrors for the most popular registries.

# What it is
[what-it-is]: #what-it-is

An operator may configure registry mirror(s) via `CNB_REGISTRY_MIRRORS`. This will allow `lifecycle` to use the mirror for all images that are requested during builds.

# How it Works
[how-it-works]: #how-it-works

Out of scope - setting up the mirror itself. This is a separate concern that is not specific to Cloud Native Buildpacks.

Once a mirror for one or more public registry has been setup, the platform operator can configure Cloud Native Buildpacks to use the mirror. This will permit `lifecycle` to use the mirrors for all images that are requested during builds using the `CNB_REGISTRY_MIRRORS` environment variable that would otherwise be requested from the public registry.

The `CNB_REGISTRY_MIRRORS` environment variable will be a list of mirror configurations. Each mirror configuration will be a key/value pair, where the key is the registry URL and the value is the mirror URL. The key/value pairs will be separated by a semicolon (`;`).

For example, if we wanted to configure a mirror for Docker Hub and Quay.io, we could set the `CNB_REGISTRY_MIRRORS` environment variable to the following:

```
docker.io=https://docker.mirror.example.com;quay.io=https://quay.mirror.example.com
```

When `lifecycle` requests an image during any phase (`analyze`, `export`, `extend`, etc.), it will first check the `CNB_REGISTRY_MIRRORS` environment variable. If the requested image's registry is configured in the `CNB_REGISTRY_MIRRORS` environment variable, it will use the mirror URL instead of the original registry URL.

If the private registry requires authentication, authentication to the registry will be handled by the existing `CNB_REGISTRY_AUTH` value. If the private registry does not require authentication, no additional configuration is required.

# Migration
[migration]: #migration

This is a new feature and will not affect older platforms.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

Complexity. We'll have to teach `lifecycle` how to use the configured mirrors. This will add complexity to the codebase and will require additional testing.

Breaking expectations. If a platform operator were to fall behind or modify an image in the mirror, the resulting image would not match the image built by an end user against the public registry.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

Platforms could use oci layout to try and fetch images from a local cache before going to the public registry. This would require the platform to have a local cache of all images that may be requested during builds. This would be difficult to maintain and would require a lot of disk space.

- Why is this proposal the best?

This may not be the best, but that is why we are proposing it. We'd like to hear from the community about other options.

- What is the impact of not doing this?

Operators will have to continue to deal with the reliability of public registries.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How will will teach kaniko-style extensions to use the mirrors?
- In what situations should `lifecycle` fallback to the original registry if the mirror is unavailable?
- Should the mirror be put into the metadata at all for SBOM type of reasons? We know it shouldn't be written as the base image, but it could be written to a new key in the metadata.

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
