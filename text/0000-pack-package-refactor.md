# Meta

- Name: Refactor Pack go packages
- Start Date: 02/24/21
- Author(s): dwillist
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC outlines a promotion strategy and process for refactoring `pack` into consumable components as needed.

# Motivation
[motivation]: #motivation

- Why should we do this?
    - Establish some shared vision about the codebase we want to manage.
    - General refactoring benefits: 
        - Maintaining a modular and re-usable codebase enables contributors to be more effective, and encourages new adopters.
        - Ease consumption of pack as a library by having isolated and focused packages
        - Create logical seams to redistribute packages.
    
# What it is
[what-it-is]: #what-it-is
The general flow of this process is
1) Unorganized features exist & are added to the `internal` package, these are not consumable by external programs
1) Extract code from the `interal` package to `/pkg/<pkg-name>/...` to enable external consumption.
1) Provide some useful set of functionality through independent binaries at `/cmd/<bin-name>` that other platforms may consume.
1) Extract code from external packages `/pkg/<pkg-name>/...` into a separate repository (this should require an RFC)

The goal of this RFC is to:
- Reach consensus on the overall code promotion process for the `pack` repo
- Reach consensus on a "probable" target structure for `pack`

The goal of this RFC is NOT:
- to precisely define what packages we want & what their contents/functionality should be.

# How it Works
[how-it-works]: #how-it-works

### Current structure
The current state of the `pack` repo does not provide a standardized structure, and much of the logic
in the inaccessible `internal` package.
```
.
├── builder
├── buildpackage
├── cmd
│    └── pack
├── config
├── internal/...
├── logging
├── pkg
│    └── archive
├── project
├── registry
├── resources
└── tools
    └── pedantic_imports
```

Further, the structure itself is very intimidating to a new-comer - what is important?
Where does the definition/implementation live, and why is it split into multiple components without clear organization?

### Short term target structure
This is a short term approximation for the structure that we would like to see. This is not set in stone
and may be updated during implementation. 

```
.
├── cmd/
│   └── pack/ → current pack cli
├── pkg/
│   ├── archive/ → lib for converting multiple sources into OCI layers
│   ├── client/ → current pack client library
│   ├── descriptor/ → lib for processing project descriptor
│   ├── inspect/ → lib for inspecting various CNB resources (app image, buildpack, builder, stack, ...)
│   ├── internal/ → all non-exported go code
│   └── resolve/ → lib for resolving buildpacks via Buildpacks URIs
└── go.mod
```

### Possible Future structure.
This is a long term guess about which functionality we would want to pull out into packages or separate repositories.

```
.
├── cmd/
│   └── pack/ → current pack cli
├── pkg/
│   ├── client/ → current pack client library
│   ├── descriptor/ → lib for processing project descriptor
│   ├── inspect/ → lib for inspecting various CNB resources (app image, buildpack, builder, stack, ...)
│   ├── internal/ → all non-exported go code
│   ├── stack/ → lib for mixin validation & stack labels
│   ├── builder/ → lib for builder labels & builder manipulation
│   ├── buildpackage/ → lib for buildpackage label & buildpack extraction from buildpackages
│   └── resolve/ → lib for resolving buildpacks via Buildpacks URIs
└── go.mod

archive → pulled to a separate repo.
```

# Alternatives
[alternatives]: #alternatives
- We proceed with ad-hoc refactorings
- A more or less ambitious short term target.

# Prior Art
[prior-art]: #prior-art
Other projects that have a similar structure:
- [Standard Go Project Layout](https://github.com/golang-standards/project-layout)
- [GGCR](https://github.com/google/go-containerregistry)

Initial conversation that lead to this RFC:
- [buildpacks/community#51](https://github.com/buildpacks/community/discussions/51)