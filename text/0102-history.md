# Meta
[meta]: #meta
- Name: Buildpack layer metadata
- Start Date: 2021-12-02
- Author(s): [@samj1912](https://github.com/samj1912)
- Status: Approved
- RFC Pull Request: [rfcs#194](https://github.com/buildpacks/rfcs/pull/194)
- CNB Pull Request: (leave blank)
- CNB Issue: N/A
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Add layer history metadata to the output image for buildpack and app layers to improve visualization in tools like `DockerHub`, `dive` etc.

# Definitions
[definitions]: #definitions

`history`: The history key in the `OCI` config. See [properties](https://github.com/opencontainers/image-spec/blob/main/config.md#properties)

# Motivation
[motivation]: #motivation

This will allow Buildpack built images to be better visualized by common container visualization and debugging tools.

# What it is
[what-it-is]: #what-it-is

Various container image introspection tools look at `history.created_by` for each layer to visualize the layer. We should populate this key with a value that describes where a layer came from, for buildpacks this can be -

- `Layer: {{ buildpack.layer.name }}, Created by: {{ buildpack.id }}@{{ buildpack.version }}`

for app layers, this can be - 

- `Application Slice: {{ slice_number }} Created by: {{ buildpack.id }}@{{ buildpack.version }}`

Where `slice_number` is just an integer number starting with `1` and the `buildpack.id` is the id of the buildpack that specified the application slice.

for config layer, this can be -

- `Buildpacks Launcher Config`

for SBOM layer, this can be - 

- `Software Bill-of-Materials`

for launcher this can be - 

- `Buildpacks Application Launcher`

for the process types layer this can be -

- `Buildpacks Process Types`

For the base image, the lifecycle should copy the existing history to the output image.
# How it Works
[how-it-works]: #how-it-works

The lifecycle adds the above metadata to the output config blob.

# Drawbacks
[drawbacks]: #drawbacks

More complexity?

# Alternatives
[alternatives]: #alternatives

Allow buildpacks to create image history metadata.

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Noted above.
