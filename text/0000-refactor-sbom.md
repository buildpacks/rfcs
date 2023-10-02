# Meta
[meta]: #meta
- Name: Refactor SBOM
- Start Date: 2023-09-29
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpacks/rfcs/pull/195, https://github.com/buildpacks/rfcs/pull/278

# Summary
[summary]: #summary

This RFC proposes optionally relocating SBOM files for buildpack-provided dependencies from the application image to in-toto attestations
in an OCI registry
via a new optional lifecycle phase called `sign`.

# Definitions
[definitions]: #definitions

**SBOM files for buildpack-provided dependencies** - described in detail in [RFC 0095](https://github.com/buildpacks/rfcs/blob/main/text/0095-sbom.md), 
buildpacks may output SBOM files in known formats at known locations,
and the lifecycle includes these as a (single) layer in the application image.
The SBOM files may be image-scoped or layer-scoped.
The layer-scoped files are restored on future builds so that buildpacks can use them during the build phase.

**image signature** - allows for cryptographically verifying the digest of an OCI image

**in-toto [attestations](https://github.com/in-toto/attestation/blob/main/spec/README.md)** - signed statements about software artifacts

**[cosign](https://github.com/sigstore/cosign/tree/main#cosign)** - tooling for generating image signatures and attestations

**OCI v1.1** - pending new releases to the OCI image and distribution specs, as described [here](https://opencontainers.org/posts/blog/2023-07-07-summary-of-upcoming-changes-in-oci-image-and-distribution-specs-v-1-1/)

Notably, these new specs codify ways of "attaching" arbitrary OCI artifacts to an image -
 - via the Referrers API if supported by the registry
   - the manifest for each artifact should contain:
     - `subject` to point to the image described by the artifact
 - via Referrers Tag Schema (fallback) if Referrers API is not supported by the registry
   - a manifest "list" published to tag `sha256-<image digest>` where each list element should contain:
     - `artifactType` corresponding to the `config.mediaType` in the manifest

# Motivation
[motivation]: #motivation

- Why should we do this? Our current approach has a few drawbacks, namely:
  * It can make application images quite large
  * It can be hard to find SBOMs for buildpacks-built images; ecosystem tooling such as `cosign download sbom` won't work (see [PR 278](https://github.com/buildpacks/rfcs/pull/278))
  * There is no clear way to associate SBOMs for build and run base images with an application image (today this is unspec'd and entirely up to the platform to manage)


- What use cases does it support?
  * TODO


- What is the expected outcome?
  * Smaller application images
  * Integration with ecosystem tooling
  * (Eventually) A more complete SBOM for buildpacks-built images

# What it is
[what-it-is]: #what-it-is

- Define the target persona: buildpack user, platform operator.
- Explaining the feature largely in terms of examples. TODO
- If applicable, provide sample error messages, deprecation warnings, or migration guidance. TODO
- If applicable, describe the differences between teaching this to existing users and new users. TODO

# How it Works
[how-it-works]: #how-it-works

## Setup

The lifecycle will ship with a new `signer` binary.
In the past we've talked about making this totally separate from the lifecycle,
but given the need to restore SBOM data and thus teach the lifecycle about attestations, there isn't much value there.
We should make it possible to invoke the `signer` separately from other phases.

Buildpacks should continue to output SBOM files as before. We won't need to bother buildpack authors with this change.

## Export

The `exporter` will accept a new optional flag `-omit-sbom` that defaults to `false`.
* If `-omit-sbom=false` the exporter will behave as today, and include the SBOM layer containing the `<layers>/sbom/launch/` directory in the application image.
* If `-omit-sbom=true` the exporter will not create the SBOM layer, but `<layers>/sbom/launch/` will remain on the filesystem and be available to the `signer`.

The exporter will additionally generate configuration for the `signer` irrespective of the value of `-omit-sbom`.

## Sign

The `signer` will accept configuration that will allow it to sign images with `cosign`. 
An example `cosign.toml` was provided in [PR 195](https://github.com/buildpacks/rfcs/pull/195), however there were concerns about encoding sensitive data (such as passwords) in files.
We should explore secure ways of allowing the platform to inject this data (TODO).
It's worth noting that `cosign` as of v2 prefers keyless signing.

The `signer` can both sign the image and attach attestations to it. By default, we should do both - but we may want to make this configurable.

The `signer` will accept configuration that will allow it to attach attestations to the application image. Perhaps:

```toml
[image]
reference = "<image digest>"

[[attestations]]
  [[attestations.predicate]]
  type = "<predicate type>"
  uri = "<path to file with contents>"
  value = "<some arbitrary value, to be used instead of uri>"
  
  [[attestations.statement.subject]]
  name = "<subject name>"
  digest = "<subject digest>"

  [[attestations.annotations]]
  name = "<name>"
  value = "<value>"
```

## Mapping layers to attestations

For each "launch" SBOM file output by buildpacks, the `exporter` will create attestation configuration, e.g.:

`<layers>/sbom/launch/<buildpack-id>/<layer-id>/bom.<ext>` (where `<ext>` is one of: `cdx.json`, `spdx.json`, or `syft.json` as currently spec'd)

or more concretely:

### Example 1 - layer-scoped SBOM file

The `exporter` will turn `/layers/sbom/launch/my-buildpack/launch-dep/sbom.cdx.json` into configuration:

```toml
  [[attestations.predicate]]
  type = "https://cyclonedx.org/bom"
  uri = "/layers/sbom/launch/my-buildpack/launch-dep/sbom.cdx.json"
  
  [[attestations.statement.subject]]
  name = "launch-dep"
  digest = "sha256:$LAYER_DIGEST"
  
  [[attestations.annotations]]
  name = "io.buildpacks.buildpack.id"
  value = "my-buildpack"
```

And the `signer` will turn this into an in-toto statement that looks like:

TODO

It's worth noting, many buildpacks-produced SBOM files will be "layer-scoped" meaning that they don't describe the whole image, just a layer within it.
`cosign` has a [deprecated](https://github.com/sigstore/cosign/blob/main/specs/SBOM_SPEC.md#scopes) method of denoting the scope of an SBOM with annotations.
It now seems recommended to denote the scope with the `subject` of the attestation [statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md).

And serialize the statement in a manifest that looks like:

TODO

Note: cosign docs give an example manifest [here](https://github.com/sigstore/cosign/blob/main/specs/ATTESTATION_SPEC.md#overall-layout),
but the config media type is `application/vnd.oci.image.config.v1+json`, which doesn't give any indication that it's an SBOM.
The correct media type to use would require some research (TODO).

### Example 2 - image-scoped SBOM file

The `exporter` will turn `/layers/sbom/launch/my-buildpack/launch.sbom.cdx.json` into configuration:

```toml
  [[attestations.predicate]]
  type = "https://cyclonedx.org/bom"
  uri = "/layers/sbom/launch/my-buildpack/launch.sbom.cdx.json"
  
  [[attestations.statement.subject]]
  name = "all" # or something? not sure what is recommended
  digest = "sha256:$IMAGE_DIGEST"
```

### Example 3 - platform-provided SBOM file

Platforms could inject TOML to describe the run image, e.g.:

```toml
  [[attestations.predicate]]
  type = "https://cyclonedx.org/bom"
  uri = "/platform/some-file.cdx.json"
  
  [[attestations.statement.subject]]
  name = "run" # maybe?
  digest = "sha256:$RUN_IMAGE_DIGEST" # is it possible to denote a list of layers? Like in the deprecated cosign SBOM spec?
```

## Rebase

During `rebase`, the lifecycle should verify attestations for the old application image, and remove any attestations where the subjects are no longer valid
when signing the new image digest
(e.g., if the subject references a layer in the old run image that is no longer present, the attestation will be removed).

It should optionally accept configuration for new attestations to describe the new run image (or whatever else the platform wants to add).

## Next builds

During `analyze`, the lifecyle should verify attestations for the previous application image, and download the SBOM data as files in `<layers>/sbom/launch/`
so that the `restorer` can behave just as it does today when recreating `<layers>/<buildpack-id>/<layer>.sbom.<ext>` files for buildpacks.

The lifecycle should fall back to pulling the SBOM layer from the previous image if no attestations exist
(this will be necessary to keep compatibility with daemon images).

# Migration
[migration]: #migration

TODO

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this? TODO

# Alternatives
[alternatives]: #alternatives

TODO

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

# Prior Art
[prior-art]: #prior-art

TODO

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  - What should we do about image extensions? They don't create SBOM files today in any specified way. Maybe they should?
  - What should we do about SBOM files for cache? Should they have the same lifecycle as SBOM files for launch? Opinion: yes, and they should have the same fallback mechanism.
- What parts of the design do you expect to be resolved through implementation of the feature?
  - TODO
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
  - Merging data from SBOM files together

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.

TODO

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