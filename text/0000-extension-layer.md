# Meta
[meta]: #meta
- Name: Add extension layer to exchange data
- Start Date: 2023-10-09
- Author(s): [c0d1ngm0nk3y](https://github.com/c0d1ngm0nk3y), [pbusko](https://github.com/pbusko)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request:
- CNB Pull Request:
- CNB Issue:
- Related: [RFC#0105 Support Dockerfiles](https://github.com/buildpacks/rfcs/blob/main/text/0105-dockerfiles.md)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC introduces support for Extension Layers to allow data transfer between the build environment and the Kaniko execution.

# Motivation
[motivation]: #motivation

This change allows extensions to possess their own layers to utilize during the generation/extend process. Additionally, it ensures that extension output does not inadvertently interfere with other extension or buildpack layers during the build, and it does not unintentionally become part of the final application image.

This would allow distroless run images to be extended.

# What it is
[what-it-is]: #what-it-is

This follows up on RFC-0105 and proposes that during the execution of the extension's `bin/generate`, an extension is allowed to write arbitrary data to its exclusive layer. This data then becomes accessible during the execution of the `extend` phase via Kaniko context. The content of these extension-specific layers is ignored at build and launch time, it serves only the extension phase.

# How it Works
[how-it-works]: #how-it-works

Before execution of the `bin/generate`, the lifecycle will create a distinct writable layer for each extension which passed detection. The extensions can then write to these layers, and the Kaniko context is set to the corresponding layer during the `extend` phase instead of the `<app>` directory. The Extension Layers will not be included in the final image by the lifecycle.

The location of the Extension Layer will be provided to the `bin/generate` via additional environment variable `CNB_EXT_LAYER_DIR`.

# Migration
[migration]: #migration

Since we would change the Kaniko context, this would be breaking for existing extensions.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

The workspace would no longer be the Kaniko context. But the benefit of having it in the first place seems quite limited anyway.

# Alternatives
[alternatives]: #alternatives

- Allow multi-stage Dockerfiles

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should the `bin/generate` be executed during the `extend` phase instead of the `detect` phase?
- The Kaniko context might consist of two folders: `<app>` and the Extension Layer for better compatibility.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires changes to the layers metadata and the `extend` phase:

- layer metadata needs ti ubducate if a layer is a "extension layer"
- env variable with the layer location for the extension to write to
- kaniko context should be the extension layer and not the workspace

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