# Meta
[meta]: #meta
- Name: Additional OCI Artifacts from Buildpacks
- Start Date: 2022-04-24
- Author(s): agracey
- Status: Approved
- RFC Pull Request: https://github.com/buildpacks/rfcs/pull/223
- CNB Pull Request: n/a
- CNB Issue: n/a
- Supersedes: n/a

# Summary
[summary]: #summary

Allow buildpack authors to specify additional artifacts from their buildpacks to be uploaded to a registry along with the standard set of layers.

# Definitions
[definitions]: #definitions


- WebAssembly (WASM) -- Portable binaries to be run with a WebAssembly virtual machine.
- [OCI Artifact](https://github.com/opencontainers/artifacts/blob/main/definitions-terms.md#media-type) -- Any blob of data that can be stored in an OCI registry. From the spec:
> An artifact has a type, which has a collection of layers. The Artifact is defined as unique by its `manifest.config.mediaType`. Layers are defined by their `layer.config.mediaType`.

# Motivation
[motivation]: #motivation

Cloud Native Buildpacks are awesome for building container images but come with a draw back that they can only produce a single output. This is limiting to platform builders because there are many cases where you might want to have multiple outputs from the same build process.

# What it is
[what-it-is]: #what-it-is

This change allows for additional flexibility in what buildpack authors and platforms can build on top of buildpacks. Three initial use cases are WebAssembly, test output, and Helm charts.

For the first, a buildpack would be able to also generate a wasm bundle that can be used by a downstream platform (such as the Krustlet or runwasi).

Similarly, by allowing the buildpack to produce a helm chart, you could integrate in logic about how to set up an application into the build pipeline where you are able to do bits of code analysis. (NetworkPolicies that lock down an app, sidecars that need to be run, ConfigMaps to pass around out-of-band, etc...)

Lastly, it may be advantageous to allow a buildpack to produce the results of unit tests and publish alongside the container itself. Then a tool (such as Kubewarden) could gate running of the container based on the passing tests.

# How it Works
[how-it-works]: #how-it-works

Add an optional file per layer called `artifacts.toml` that tells lifecycle to publish the specified file(s) in the layer to an OCI registry in the publish step. It also needs to allow for setting labels and the tag to publish with.

For the WASM use-case, a buildpack author looking to also publish a node.js WASM bundle would write the build logic like any other buildpack. Create a directory in $LAYERS_DIR with the following `artifacts.toml`:

```
[[artifact]]
tag = "wasm"
file = "mywasmprogram.wasm"    # Should be a file relative to the current $LAYERS_DIR

[[artifact.labels]]
ConfigMediaType       = "application/vnd.wasm.config.v1+json"
ContentLayerMediaType = "application/vnd.wasm.content.layer.v1+wasm"
```

As a note: to keep this generic to any potential OCI artifact, it seems best to provide a labelling mechanism instead of prescribing certain fields.

# Migration
[migration]: #migration

This functionality should be purely additive and not break existing buildpacks.

# Drawbacks
[drawbacks]: #drawbacks

This does bring in additional scope to the project and could potentially lead to confusion around what OCI image that got published should be used. This can be mitigated with good docs and platform output. Adding a change to make the standard image output optional seems like a larger change than is appropriate at the moment.

# Alternatives
[alternatives]: #alternatives

Other ways of doing this would be to add the artifacts to the primary OCI image directly then pull back out in a future stage. This has two obvious issues: artifact size and escalation in tooling needed in pipeline.

# Prior Art
[prior-art]: #prior-art

None that I'm aware of.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- [] What to do when there are collisions in tags.
- [] Could the [Bindle](https://github.com/deislabs/bindle) project help?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

The only addition to the spec is the addition of the artifacts.toml as well as the changes to lifecycle to parse and act on the new config.

