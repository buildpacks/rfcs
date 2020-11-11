# Meta
[meta]: #meta
- Name: Relax Mixin Contract
- Start Date: 2020-08-12
- Author(s): @sclevine
- RFC Pull Request: [rfcs#109](https://github.com/buildpacks/rfcs/pull/109)
- CNB Pull Request: (leave blank)
- CNB Issue: https://github.com/buildpacks/spec/issues/149, https://github.com/buildpacks/pack/issues/868, https://github.com/buildpacks/lifecycle/issues/425
- Supersedes: N/A

# Summary
[summary]: #summary

Mixins are used to imply multiple contracts:

1. A contract between a buildpack and a stack, where the buildpack may state that it can only be used with stack images that have certain dependencies.

2. A contract between a stack run image and stack build image, where apps built on the build image must have a certain dependency present on the run image to start successfully on the run image.

Currently, if a stack build image has the mixin `build:mypkg` and a stack run image has the mixin `run:mypkg`, a buildpack cannot require the mixin as `mypkg` (either statically in buildpack.toml, or dynamically via the stackpack mechanism described in [#87](https://github.com/buildpacks/rfcs/issues/87)). A stack author may choose to use this configuration because the same dependency is used in different, unrelated ways in both images.

Similarly, if a stack build image shares the mixin `mypkg` with the stack run image, a buildpack cannot require the mixin `build:mypkg` or `run:mypkg`, even though both images contain `mypkg`.

This RFC proposed that we update the buildpack specification to create a new relationship between `mypkg`, `run:mypkg`, and `build:mypkg`.

- `run:mypkg` and `mypkg` imply the same set of changes to the run image, such that buildpacks requiring `mypkg` would be satisfied with `run:mypkg` at runtime (and vice versa).

- `build:mypkg` and `mypkg` imply the same set of changes to the build image, such that buildpacks requiring `mypkg` would be satisfied with `build:mypkg` at build-time (and vice versa).

- A runtime stackpack that needs to satisfy `run:mypkg` or `mypkg` would only be provided with `mypkg`, regardless of which version is required. The stackpack would have no knowledge of whether it could expect the build image to have the corresponding mixin.

- A build-time stackpack that needs to satisfy `build:mypkg` or `mypkg` would only be provided with `mypkg`, regardless of which version is required. The stackpack would have no knowledge of whether it could expect the run image to have the corresponding mixin.


# Definitions
[definitions]: #definitions

- [**mixins** and **stage specifiers**](https://github.com/buildpacks/spec/blob/main/platform.md#mixins)
- [**contractual compatibility** driven by ABI](https://github.com/buildpacks/spec/blob/main/platform.md#compatibility-guarantees)


# Motivation
[motivation]: #motivation

1. Stack authors must currently provide both stage-specific and non-stage-specific versions of mixin names on each image to ensure that buildpacks can require mixins with or without the stage specifier. This is unfriendly UX for stack authors, and difficult to explain.

2. Stack authors are unable to relax the contract between the build and run image (by only using the stage-specifier version of the mixins) without requiring the buildpacks manually list the mixin twice with the different stage specifiers.

3. Under the pre-RFC mixin definition, stackpacks (specified in [#87](https://github.com/buildpacks/rfcs/issues/87)) will attempt to re-install packages when stage-specifier is mismatched between the buildpack and stack images. For instance, a buildpack requesting `mypkg` would result in the stackpack attempting to install `mypkg` on a run image with `run:mypkg`.


# How it Works
[how-it-works]: #how-it-works

Pack and lifecycle will relax contractual restrictions when initiating builds, creating builders, and exporting images.

# Drawbacks
[drawbacks]: #drawbacks

This change reduces the power of the mixin model for stack authors. Previously, stack authors could reliably use `run:mypkg` to indicate that a run image strictly contains the runtime version of mypkg (which may provide different functionality than `mypkg`). Now `run:mypkg` and `mypkg` imply the exact same thing for the run image.

# Alternatives
[alternatives]: #alternatives

- Refactor mixins entirely, e.g., enforce stack<->stack and stack<->buildpack mixin interfaces separately.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This changes how mixin contracts are enforced in the Platform API spec.
