# Meta

- Name: Refactor Pack go packages
- Start Date: 02/24/21
- Author(s): dwillist
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary

This RFC proposes a restructuring of the `pack` codebase into reusable modular packages.

# Motivation

- Why should we do this?
    - Maintaining a modular and re-usable codebase enables contributors to be more effective, and encourages new adopters.
    - Ease consumption of pack as a library by having isolated and focused packages
    - Create logical seams to redistribute packages.

# What it is

This RFC is looking accomplish the following:

- enable pack library consumers by moving code out of `internal`
- ease the process of contribution by having well defined connectable components.
- Follow a general process of if data is externally visible on a pack produced artifact. We should provide structs for decoding.

To accomplish the above we propose the following package structure:

```
.
├── cmd/
│   ├── pack/ → current pack cli
│   └── fetcher/ → cli to download buildpacks
├── pkg/
│   ├── archive/ → lib for converting multiple sources into OCI layers
│   ├── client/ → current pack client library
│   ├── descriptor/ → lib for processing project descriptor
│   ├── inspect/ → lib for inspecting various CNB resources (app image, buildpack, builder, stack, ...)
│   ├── internal/ → all non-exported go code
│   ├── stack/ → lib for mixin validation & stack labels
│   ├── builder/ → lib for builder labels & builder manipulation
│   ├── buildpackage/ → lib for buildpackage label & buildpack extraction from buildpackages
│   └── resolve/ → lib for resolving buildpacks via Buildpacks URIs
└── go.mod
```

# Unresolved Questions

- What parts of the design do you expect to be resolved through implementation of the feature?
    Given the above is a top down view of the expected package structure it would be beneficial to keep this RFC open while implementing this refactor to allow for feedback.
