# Meta
[meta]: #meta
- Name: Lifecycle package refactor
- Start Date: 2022-04-15
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes a re-organization of the lifecycle package structure to make the lifecycle easier to understand and easier to extend.

# Motivation
[motivation]: #motivation

The lifecycle has grown in complexity since its initial development. It now supports 7 buildpack apis, and 7 platform apis (and every possible combination of both apis!). With the addition of https://github.com/buildpacks/rfcs/pull/173, it will take on even more responsibilities.

With the current package structure, it can be challenging to determine where to put new code when new features are added. Various patterns for code organization have been tried. If we can identify which patterns have been most useful, and perpetuate those going forward, the lifecycle over time will become more organized and pleasant to work with.

# What it is
[what-it-is]: #what-it-is

The target personas for this RFC are lifecycle contributors and lifecycle library consumers.

Here is the current package structure:

```
├── api                         # helpers for working with api versions - mostly absent CNB logic except for Buildpack and Platform vars
├── archive                     # helpers for working with tars - no CNB logic; mostly used by layers package
├── auth                        # a wrapper around GGCR’s authn.Keychain that also reads the CNB_REGISTRY_AUTH env var; used by cmd package
├── buildpack                   # logic pertaining to the Buildpack API
├── cache                       # 3 implementations of the Cache interface; used by cmd package
├── cmd
│   ├── launcher
│   ├── lifecycle
├── env                         # helpers for constructing the environment for a buildpack during build, or for an app during launch
├── image                       # helpers for working with registries and images
├── internal
│   ├── encoding                # WriteTOML and WriteJSON
│   ├── io                      # Copy
│   ├── layer                   # metadata restorer, sbom restorer
│   └── str                     # Compare
├── launch                      # logic for launching a process; used by cmd/launcher
├── layers                      # logic for reading and writing layers; mostly used by exporter - also elsewhere for the concept of layers.Slice
├── platform                    # contains structs representing platform spec’d data formats and exit code logic
├── priv                        # logic for running the lifecycle as a particular user; used by cmd package
├── analyzer.go                 # lifecycle logic lives in the top level
├── detector.go
├── rebaser.go
├── ...
```

Here is the proposed package structure:

```
├── cmd
│    ├── launcher
│    ├── lifecycle
├── internal
│    ├── buildpack              # services for handling logic that branches on buildpack api - e.g., bom validator
│    ├── encoding
│    ├── image
│    ├── io
│    ├── platform               # services for handling logic that branches on platform api - e.g., metadata restorer, sbom restorer, potentially a new sbom copier, etc.
│    └── str
├── pkg
│    ├── api                    # old api package with CNB logic that indicates supported and deprecated apis moved elsewhere
│    ├── archive
│    ├── buildpack
│    │   ├── env
│    │   ├── launch
│    ├── lifecycle
│    │   ├── layers
│    │   ├── analyzer.go        # lifecycle logic moved to nested package
│    │   ├── detector.go
│    │   ├── rebaser.go
│    │   ├── ...
│    └── platform
│        ├── auth
│        ├── cache
│        ├── inputs             # handles platform <-> lifecycle interface (args, flags)
│        ├── launch
│        │   └── inputs         # handles platform <-> launcher interface (args, flags)
│        └── priv
```

## Considerations

* The structure of the lifecycle should mirror the spec as much as possible. However we should recognize that the spec is not perfect. Also, while there is a `lifecycle` package, there is no "lifecycle spec" - the responsibilities of the lifecycle are mixed between the platform and buildpack specs (see below).
* In general the `lifecycle` package should be more of an orchestrator - see [example](https://github.com/buildpacks/lifecycle/blob/b6803be364429689a818a5d0a09db42bd21b9995/analyzer.go#L52-L54). We should push as much logic as possible into services.
* CNB business logic should live inside the `buildpack`, `lifecycle`, and `platform` packages (and their nested packages) or their `internal` equivalents. All other packages that are direct children of `pkg` or `internal` should be CNB-free.
* Logic that branches on api version should be handled by an internal service nested under the appropriate package - e.g., logic that branches on buildpack api should live in `internal/buildpack` - see [example](https://github.com/buildpacks/lifecycle/blob/b6803be364429689a818a5d0a09db42bd21b9995/buildpack/bom.go#L14-L23).
* Tests should serve as documentation for apis by enumerating which services are in use - see [example](https://github.com/buildpacks/lifecycle/blob/a457244e2785afd342fe511563445a4fa4554e3e/platform/inputs/analyzer_factory_test.go#L353-L375).
* To keep the launcher as lean as possible, we should minimize the packages it depends on (hence `platform/launch/inputs`).

## Aligning with the spec

The spec has this structure (abridged):

Platform:

  - Stacks
  - Lifecycle
    - Operations
      - Build
      - Rebase
      - Launch
    - Platform inputs and outputs (args, flags, env vars, mounts, exit codes)
    - Registry auth
  - Buildpacks directory layout
  - Additional guidance
    - Environment
      - Stack provided vars
      - Platform provided vars (platform/env)
    - Caching
  - Data format (file and label schema)

Buildpack:

  - Buildpack interface
    - Detect
    - Build
    - Exec.d
    - Layer types
  - App interface (profile.d)
  - Detection: /bin/detect, order resolution
  - Analysis: restored metadata
  - Build: /bin/build, build plan, SBOM, layers
  - Export: layer re-use, slices, caching
  - Launch: execution strategy (direct/indirect), exec.d,  profile.d
  - Environment
    - Layer env dirs
    - Platform provided (stack, platform/env)
    - Modification rules (append, prepend, etc.)
  - Data format (file and exec.d schema)

# Migration
[migration]: #migration

Lifecycle contributors will need to agree on and become comfortable using the new structure. Library consumers will need to update package import paths in their code.

# Drawbacks
[drawbacks]: #drawbacks

Changing package import paths will be a breaking change for library consumers (GitHub [search](https://github.com/search?o=desc&q=%22github.com%2Fbuildpacks%2Flifecycle%22&s=indexed&type=Code)). However this is mitigated by version locking in `go.mod`.

There have also (to this point) been no firm stability guarantees when using the lifecycle as a library. If we (hopefully, through this RFC) settle on a package structure that works for us, we might be able to offer some promises of stability in the future.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered? Doing nothing, just keep adding code as best we can.
- Why is this proposal the best? Making it easier to add new code will allow us to deliver features faster.
- What is the impact of not doing this? Continued frustration for lifecycle contributors.

# Prior Art
[prior-art]: #prior-art

* pack package refactor [RFC](https://github.com/buildpacks/rfcs/blob/main/text/0082-pack-package-refactor.md)
* [Standard Go Project Layout](https://github.com/golang-standards/project-layout)
* [GGCR](https://github.com/google/go-containerregistry)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged? We should have a hearty discussion about the proposed changes before implementing them, as we'll likely have to live with them for awhile.

- How can we contribute the changes so that the diff is understandable (for the purpose of PR review)? There are going to be a lot of changed files. Maybe we can divide the work up over multiple PRs.

- What parts of the design do you expect to be resolved through implementation of the feature? Some packages may need to be divided or combined in order to ensure cohesion or avoid import cycles. We won't be able to foresee all of the changes that will be necessary. But we should agree on the general structure that we're aiming for.
