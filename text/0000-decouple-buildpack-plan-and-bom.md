# Meta
[meta]: #meta
- Name: Decouple Buildpack Plan and Bill-of-Materials
- Start Date: 2020-07-26
- Author(s): @sclevine
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The Buildpack Plan and Bill-of-Materials are currently coupled together. Buildpack Plan entries may be modified by buildpacks during the build phase, and the modified results become the Bill-of-Materials. This RFC proposes that we make the Build Plan immutable during the build phase and introduce additional arguments to `/bin/build` that are used to manage the Bill-of-Materials.

# Motivation
[motivation]: #motivation

The Build Plan is used for inter-buildpack communication and may result in Buildpack Plan entries for build-time-only dependencies. These build-time-only dependency entries may contain metadata that do not affect the final image. This means that other reproducible images may not be reproduced when, for example, minor build utilities change version.

Additionally, it's currently impossible to remove build-time dependency entries in the Buildpack Plan from the Bill-of-Materials, because removing entries from the Buildpack Plan is used to "push" them to subsequent buildpacks that also offered to provide them.

# What it is
[what-it-is]: #what-it-is

Currently, there is a single file provided to `/bin/build` that contains the Buildpack Plan entries for the buildpack. Entries may be removed from the Buildpack Plan by the buildpack in order to pass the entries to subsequent buildpacks that offered to provide the same entry. Entries may instead be modified, so that the Bill-of-Materials contains more detailed metadata.

This RFC proposes that we replace the current Buildpack Plan argument with four arguments:
1. The Buildpack Plan (read-only)
2. Bill-of-Materials entries for metadata that is added to the image's Bill-of-Materials label. (Would starts empty, be r/w, used for stuff that's actually in the image.)
3. Bill-of-Materials entries for metadata that is not added to the image labels. (Would start empty, be r/w, used for build-time dependencies.)
4. Buildpack Plan entries that should be passed to subsequent buildpacks. (Would start empty, be r/w.)

# Drawbacks
[drawbacks]: #drawbacks

- Large breaking change. Metadata written by all current buildpacks would immediately disappear.
- More arguments.

# Alternatives
[alternatives]: #alternatives

- Keep current behavior as-is.
- Keep current behavior around removing entries from the build plan, but switch to new files for the Bill-of-Materials.
- Keep current behavior around removing entries from the build plan, but switch to single files for the Bill-of-Materials (just runtime dependencies).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- I highly suggest that we switch to environment variables for `/bin/build` arguments before we implement this RFC.

# Spec. Changes
[spec-changes]: #spec-changes
The Buildpack Plan sections of the Buildpack API spec would change.
