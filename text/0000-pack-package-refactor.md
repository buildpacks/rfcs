# Meta

- Name: Refactor Pack go packages
- Start Date: 02/24/21
- Author(s): dwillist
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary

This RFC outlines a promotion strategy and process for refactoring `pack` into consumable components as needed.

# Motivation

- Why should we do this?
    - Establish some shared vision about the codebase we want to manage.
    - General refactoring benifits: 
        - Maintaining a modular and re-usable codebase enables contributors to be more effective, and encourages new adopters.
        - Ease consumption of pack as a library by having isolated and focused packages
        - Create logical seams to redistribute packages.

# What it is
The general flow of this process is
1) Unorganized features exist & are added to the `internal` package, these are not consumable by external programs
2) Extract code from the `interal` package to `/pkg/<pkg-name>/...` to enable external consumption.
3) Provide some useful set of functionality through independent binaries at `/cmd/<bin-name>` that other platforms may consume.
4) Extract code from external packages `/pkg/<pkg-name>/...` into a separate repository (this should require an RFC)

The goal of this RFC is to:
- Reach consensus on the overall code promotion process for the `pack` repo
- Reach consensus on a possible target structure for `pack`

The goal of this RFC is NOT:
- to precisely define what packages we want & what their contents/functionality should be.


#### Current structure
The current structure does not provide a standardized structure 
```
.
├── builder
├── buildpackage
├── cmd
│    └── pack
├── config
├── internal/...
├── logging
├── out
│    └── tests
├── pkg
│    └── archive
├── project
├── registry
├── resources
└── tools
    └── pedantic_imports
```


First refactoring target structure. Note this is not set in stone.

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

Possible Future Structure

```
.
├── cmd/
│   ├── pack/ → current pack cli
│   ├── env-vars/ → cli for handling platform env vars.
│   └── fetcher/ → cli to download buildpacks.
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