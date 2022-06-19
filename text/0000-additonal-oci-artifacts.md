# Meta
[meta]: #meta
- Name: Additional OCI Artifacts from Buildpacks
- Start Date: 2022-04-24
- Author(s): agracey
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Allow buildpack authors to specify additional artifacts from their buildpacks to be uploaded to a registry along with the standard set of layers. 

# Definitions
[definitions]: #definitions

Make a list of the definitions that may be useful for those reviewing. Include phrases and words that buildpack authors or other interested parties may not be familiar with.

- WebAssembly (WASM) -- Portable binaries to be run with a WebAssembly virtual machine.
- OCI Artifact -- Any blob of data that can be stored in an OCI registry

# Motivation
[motivation]: #motivation

Cloud Native Buildpacks are awesome for building container images but come with a draw back that they can only produce a single output. This is limiting to platform builders because there are many cases where you might want to have multiple outputs from the same build process. 

# What it is
[what-it-is]: #what-it-is

This change allows for additional flexibility in what buildpack authors and platforms can build on top of buildpacks. Two initial use cases are WebAssembly and Helm.

For the first, a buildpack would be able to also generate a wasm bundle that can be used by a downstream platform (such as the Krustlet or runwasi). 

Similarly, by allowing the buildpack to produce a helm chart, you could integrate in logic about how to set up an application into the build pipeline where you are able to do bits of code analysis. (NetworkPolicies that lock down an app, sidecars that need to be run, ConfigMaps to pass around out-of-band, etc...)

# How it Works
[how-it-works]: #how-it-works

Add a field in the `layer.toml` spec called `additionalArtifact` that tells lifecycle to publish the specified file(s) in the layer to an OCI registry in the publish step. It also needs to allow for setting labels and the tag to publish with. 

For the WASM usecase, a buildpack author looking to also publish a node.js WASM bundle would write the build logic like any other buildpack. Create a directory in $LAYERS_DIR with the following `layer.toml`:

```
[types]
publish = false
cache = false

[[additionalArtifact]]
tag = "wasm"
file = "mywasmprogram.wasm"    # Should be a file in $LAYERS_DIR

[[additionalArtifact.labels]]
ConfigMediaType       = "application/vnd.wasm.config.v1+json"
ContentLayerMediaType = "application/vnd.wasm.content.layer.v1+wasm"
```


# Migration
[migration]: #migration

This functionality should be purely additive and not break existing buildpacks. 

# Drawbacks
[drawbacks]: #drawbacks

This does bring in additional scope to the project and could potentially lead to confusion around what OCI image that got published should be used. I think this can be mitigated with good docs and platform output. 

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

The main addition to the spec is the addition of the fields in layer.toml as well as the changes to lifecycle to see them.

