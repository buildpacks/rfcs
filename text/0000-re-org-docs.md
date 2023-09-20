# Meta
[meta]: #meta
- Name: Reorganize docs website
- Start Date: (fill in today's date: 2023-09-20)
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes reorganizing the docs website according to personas and the "four quadrants of docs" aka the [Divio documentation system](https://documentation.divio.com/structure.html).

# Definitions
[definitions]: #definitions

* Personas - people with different roles who interact with the CNB project in different ways
  * Buildpack Authors - write buildpacks
  * App Developers - use buildpacks
  * Platform Operators - orchestrate buildpacks builds
  * ...
* Four quadrants
  * Tutorials - from Divio: `lessons that take the reader by the hand through a series of steps to complete a project of some kind`
  * Explanations - from Divio: `discussion [that] clarify and illuminate a particular topic`
  * How-to guides - from Divio: `take the reader through the steps required to solve a real-world problem`
  * Reference - from Divio: `technical descriptions of the machinery and how to operate it` (similar to CNB spec)

# Motivation
[motivation]: #motivation

- Why should we do this?
  - Our docs website is a bit disorganized - it's hard to find stuff, and it's hard to add stuff. Consequently, the content of our docs is woefully incomplete.
- What is the expected outcome?
  - Our docs website will be easier to use for everyone. Eventually, the content of our docs will become more complete as it's easier to add stuff.

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define the target persona: all personas, including project contributors, can benefit from this.
- Explaining the feature largely in terms of examples.
  - See the example [branch](https://github.com/buildpacks/docs/tree/refactor) of github.com/buildpacks/docs and abbreviated tree with notes below.

# How it Works
[how-it-works]: #how-it-works

```
.
├── concepts <- NOTE: this corresponds to the explanation quadrant; this content would be largely unchanged (just reorganized slightly)
│   ├── components
│   │   ├── builder
│   │   │   ├── base-images
│   │   │   │   ├── build.md
│   │   │   │   └── run.md
│   │   │   ├── builder.md
│   │   │   ├── buildpacks
│   │   │   │   ├── buildpack.md
│   │   │   │   ├── component-buildpacks.md <- NOTE: missing content!
│   │   │   │   ├── group.md
│   │   │   │   └── order.md <- NOTE: missing content!
│   │   │   ├── extensions
│   │   │   │   └── extensions.md
│   │   │   ├── lifecycle
│   │   │   │   ├── analyze.md
│   │   │   │   ├── build.md
│   │   │   │   ├── create.md
│   │   │   │   ├── detect.md
│   │   │   │   ├── export.md
│   │   │   │   ├── launch.md
│   │   │   │   ├── rebase.md
│   │   │   │   └── restore.md
│   │   │   └── metadata
│   │   └── platform.md
│   ├── operations
│   │   ├── build.md
│   │   ├── rebase.md
├── for-app-developers
│   ├── how-to-guides
│   │   ├── configure-build-env.md
│   │   ├── declare-source-metadata.md
│   │   ├── download-sbom.md
│   │   ├── export-to-oci-layout.md
│   │   ├── mount-volumes.md
│   │   ├── specify-buildpacks.md
│   │   ├── specify-extensions.md
│   │   ├── specify-processes.md
│   │   ├── understand-failures.md <- NOTE: missing content!
│   │   ├── use-cache-image.md
│   │   ├── use-http-proxy.md
│   │   ├── use-inline-buildpacks.md
│   │   └── use-project-descriptor.md
│   └── tutorials
│       ├── advanced-build
│       │   ├── build-for-arm.md
│       │   ├── build-for-windows.md
│       │   ├── build-on-podman.md
│       │   └── reproducibility.md
│       └── basic-build
│           ├── basic-build.md
│           └── build-phases.md
├── for-buildpack-authors
│   ├── how-to-guides
│   │   ├── migrate <- NOTE: moved from the "reference" section
│   │   │   ├── buildpack-api-0.4-0.5.md
│   │   │   ├── buildpack-api-0.5-0.6.md
│   │   │   ├── buildpack-api-0.6-0.7.md
│   │   │   ├── buildpack-api-0.7-0.8.md
│   │   │   ├── buildpack-api-0.8-0.9.md
│   │   │   └── buildpack-api-0.9-0.10.md
│   │   ├── package-buildpack
│   │   │   ├── buildpack-toml.md
│   │   │   ├── package-buildpack.md
│   │   │   ├── specify-targets.md
│   │   │   └── with-clear-env.md <- NOTE: missing content!
│   │   ├── publish-buildpack
│   │   │   ├── publish-a-buildpack.md
│   │   │   └── publishing-with-github-actions.md
│   │   ├── write-buildpack
│   │   │   ├── add-labels.md <- NOTE: missing content!
│   │   │   ├── add-sbom.md
│   │   │   ├── create-layer.md
│   │   │   ├── defer-plan-entries.md <- NOTE: missing content!
│   │   │   ├── re-use-layers.md <- NOTE: missing content!
│   │   │   ├── specify-env
│   │   │   │   ├── for-build.md <- NOTE: missing content!
│   │   │   │   ├── for-process.md <- NOTE: missing content!
│   │   │   │   ├── for-run.md <- NOTE: missing content!
│   │   │   │   └── with-modifier.md <- NOTE: missing content!
│   │   │   ├── specify-processes.md
│   │   │   ├── specify-slices.md <- NOTE: missing content!
│   │   │   └── verify-targets.md
│   │   └── write-extension
│   │       └── advanced-extensions.md
│   └── tutorials <- NOTE: this would be the ruby buildpack where you have to keep updating the script every time
│       ├── advanced-buildpack
│       │   ├── build-plan.md
│       │   ├── caching.md
│       │   ├── exec-d.md <- NOTE: missing content!
│       │   ├── layer-types.md
│       │   └── processes.md
│       ├── basic-buildpack
│       │   ├── build.md
│       │   ├── building-blocks-cnb.md
│       │   ├── detection.md
│       │   └── local-env.md
│       └── basic-extension
│           ├── build-dockerfile.md
│           ├── building-blocks-extension.md
│           ├── run-dockerfile-extend.md
│           ├── run-dockerfile-switch.md
│           ├── setup-local-environment.md
│           └── why-dockerfiles.md
├── for-platform-operators
│   ├── how-to-guides
│   │   ├── create-a-builder.md
│   │   ├── create-a-stack.md
│   │   ├── migrate
│   │   │   ├── platform-api-0.10-0.11.md
│   │   │   ├── platform-api-0.11-0.12.md
│   │   │   ├── platform-api-0.3-0.4.md
│   │   │   ├── platform-api-0.4-0.5.md
│   │   │   ├── platform-api-0.5-0.6.md
│   │   │   ├── platform-api-0.6-0.7.md
│   │   │   ├── platform-api-0.7-0.8.md
│   │   │   ├── platform-api-0.8-0.9.md
│   │   │   └── platform-api-0.9-0.10.md
│   │   ├── specify-extensions.md
│   │   └── use-tooling
│   │       ├── circleci.md
│   │       ├── gitlab.md
│   │       ├── kpack.md
│   │       ├── pack
│   │       │   ├── cli
│   │       │   └── concepts
│   │       │       └── trusted_builders.md
│   │       ├── piper.md
│   │       └── tekton.md
│   └── tutorials
└── reference <- NOTE: we should keep this content as lean as possible and link back to the spec where we can, as it tends to get out of date
│   ├── config
│   │   ├── builder-config.md
│   │   ├── package-config.md
│   │   └── project-descriptor.md
│   └── spec
│   │   ├── buildpack-api.md
│   │   ├── distribution-api.md
│   │   └── platform-api.md
```

# Migration
[migration]: #migration

A lot of content would be moving from the buildpack tutorial to the buildpack how-to section.
The current buildpack tutorial has the end-user make a ruby buildpack by editing the same file over and over.
It is good for teaching but hard to explain advanced concepts like multiple processes, SBOM, etc.
We should break the advanced concepts out of the tutorial and link back to the samples (or just give short code snippets) instead.

We should make these changes in one huge PR. We should NOT attempt to redirect from old links as that would be too hard.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?
- It's a lot of work

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - Do nothing
- Why is this proposal the best?
  - Easier to find stuff
  - Easier to add stuff
  - TODO: add benefits mentioned by Divio docs system

# Prior Art
[prior-art]: #prior-art

TODO

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  - TODO
- What parts of the design do you expect to be resolved through implementation of the feature?
  - TODO
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
  - TODO

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A

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