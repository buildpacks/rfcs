# Meta
[meta]: #meta
- Name: Buildpack layer metadata
- Start Date: 2021-12-02
- Author(s): [@samj1912](https://github.com/samj1912)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Add layer history metadata to the output image for buildpack and app layers to improve visualization in tools like `DockerHub`, `dive` etc.

# Definitions
[definitions]: #definitions

`history`: The history key in the `OCI` config. See [properties](https://github.com/opencontainers/image-spec/blob/main/config.md#properties)

# Motivation
[motivation]: #motivation

This will allow Buildpack built images to be better visualized by common container visualization and debuggin tools.

# What it is
[what-it-is]: #what-it-is

The following keys will be added to the following files - 

## launch.toml

```
[[slices]]
# name is a new key which uniquely identitifies the app slice
# required key
name = "<name-of-the-slice>" # max 255 chars
```

All these tools look at `history.created_by` for each layer to visualize the layer. We should populate this key with a value that describes where a layer came from, for buildpacks this can be -

- `{{ buildpack.id }}: Buildpack: {{ buildpack.name }} Layer: {{ buildpack.layer.name }}`

for app layers, this can be - 

- `Application Slice: Name {{ slices.name }}, Created by: {{ buildpack.id }}`

Where `slice.name` comes from `slices.name` and the `buildpack.id` is the id of the buildpack that specified the application slice.

For the leftover, generic app layer, the `history.created_by` will be set to `Application Workspace`.

The above application slice name should also be added to `io.buildpacks.lifecycle.metadata.app` struct.

# How it Works
[how-it-works]: #how-it-works

The lifecycle adds the above metadata to the output config blob.

# Drawbacks
[drawbacks]: #drawbacks

More complexity?

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Noted above.