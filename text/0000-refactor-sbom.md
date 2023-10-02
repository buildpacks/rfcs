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
  * There is currently no clear way to associate SBOMs for build and run base images with an application image (today this is unspec'd and entirely up to the platform to manage)
  
- What use cases does it support?
  * As a buildpacks user, I want **signed** SBOMs for my images in an easily consumable format.
  * ...

- What is the expected outcome?
  * Smaller application images
  * Integration with ecosystem tooling
  * (Eventually) A more complete SBOM for buildpacks-built images

# What it is
[what-it-is]: #what-it-is

See [How it Works](#how-it-works).

# How it Works
[how-it-works]: #how-it-works

## Setup

The lifecycle will ship with a new `signer` binary.
In the past we've talked about making this binary totally separate from the lifecycle,
but given the need to restore SBOM data and thus teach the lifecycle about attestations, there isn't much value there.
We should make it possible to invoke the `signer` separately from other phases.
It should not be necessary to run the `signer` within the build container (although it might be more convenient to run it that way).

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
reference = "<image reference - e.g., my.registry.io/my-namespace/my-image:my-tag@sha:256$IMAGE_DIGEST>"

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

### Example 1 - image-scoped SBOM file

The `exporter` will turn `/layers/sbom/launch/my-buildpack/launch.sbom.cdx.json` into configuration:

```toml
  [[attestations.predicate]]
  type = "https://cyclonedx.org/bom"
  uri = "/layers/sbom/launch/my-buildpack/launch.sbom.cdx.json"
  
  [[attestations.statement.subject]]
  name = "my.registry.io/my-namespace/my-image:my-tag"
  digest = "sha256:$IMAGE_DIGEST"
  
  [[attestations.annotations]]
  name = "io.buildpacks.buildpack.id"
  value = "my-buildpack"
```

And the `signer` will use `cosign` to turn this into an in-toto statement that looks like:

```json
{
  "_type": "https://in-toto.io/Statement/v0.1",
  "predicateType": "https://cyclonedx.org/bom",
  "subject": [
    {
      "name": "my.registry.io/my-namespace/my-image:my-tag",
      "digest": {
        "sha256": "$IMAGE_DIGEST"
      }
    }
  ],
  "predicate": { /* data from SBOM file goes here */ }
}
```

And serialize the data as a layer in an OCI image manifest that looks like:

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": {
    "mediaType": "application/vnd.oci.image.config.v1+json",
    "size": 233,
    "digest": "sha256:s0m3d1g3st"
  },
  "layers": [
    {
      "mediaType": "application/vnd.dsse.envelope.v1+json",
      "size": 1234,
      "digest": "sha256:s0m3d1g3st",
      "annotations": {
        "dev.cosignproject.cosign/signature": "",
        "dev.sigstore.cosign/bundle": "FOO",
        "dev.sigstore.cosign/certificate": "BAR",
        "dev.sigstore.cosign/chain": "BAZ",
        "io.buildpacks.buildpack.id": "my-buildpack",
        "predicateType": "https://cyclonedx.org/bom"
      }
    }
  ]
}
```

TODO: explore the possibility of using other config media types to indicate that the artifact is an SBOM,
e.g., `cosign` may use `application/vnd.dev.cosign.artifact.sbom.v1+json`.

Where the referenced layer looks like:

```json
{
  "payloadType": "application/vnd.in-toto+json",
  "payload": "<base64 encoded in-toto statement>",
  "signatures": [
    {
      "keyid": "",
      "sig": "MEYCIQC6NShQIMi+7OJJnEP2c38WyHmIgwsgY87PXJxWyOvUUAIhAKr4If9WTUOsKKtATALOBIp7rjFZSikCNWFDWEmuoelF"
    }
  ]
}
```

### Example 2 - layer-scoped SBOM file

Many buildpacks-produced SBOM files will be "layer-scoped" meaning that they don't describe the whole image, just a layer within it.
`cosign` has a [deprecated](https://github.com/sigstore/cosign/blob/main/specs/SBOM_SPEC.md#scopes) method of denoting the scope of an SBOM with annotations.
It now seems recommended to denote the scope with the `subject` of the attestation [statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md).

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

```json
{
  "_type": "https://in-toto.io/Statement/v0.1",
  "predicateType": "https://cyclonedx.org/bom",
  "subject": [
    {
      "name": "launch-dep",
      "digest": {
        "sha256": "$LAYER_DIGEST"
      }
    }
  ],
  "predicate": { /* data from SBOM file goes here */ }
}
```

And serialize the statement in a manifest that looks like:

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": {
    "mediaType": "application/vnd.oci.image.config.v1+json",
    "size": 233,
    "digest": "sha256:s0m3d1g3st"
  },
  "layers": [
    {
      "mediaType": "application/vnd.dsse.envelope.v1+json",
      "size": 1234,
      "digest": "sha256:s0m3d1g3st",
      "annotations": {
        "dev.cosignproject.cosign/signature": "",
        "dev.sigstore.cosign/bundle": "FOO",
        "dev.sigstore.cosign/certificate": "BAR",
        "dev.sigstore.cosign/chain": "BAZ",
        "io.buildpacks.buildpack.id": "my-buildpack",
        "predicateType": "https://cyclonedx.org/bom"
      }
    }
  ]
}
```

### Example 3 - platform-provided SBOM file

Platforms could inject TOML to describe the run image, e.g.:

```toml
  [[attestations.predicate]]
  type = "https://cyclonedx.org/bom"
  uri = "/platform/some-file.cdx.json"
  
  [[attestations.statement.subject]]
  name = "my-run-image-name" # maybe?
  digest = "sha256:$RUN_IMAGE_DIGEST" # TODO: is it possible to denote a list of layers? Like in the deprecated cosign SBOM spec?
```

## Attaching attestations to images

There are a few known methods to associate the attestation manifest to the image it describes.

1. `cosign` currently does this by creating an `my.registry.io/my-namespace/my-image:sha256-<image digest>.att` tag in the registry pointing to the attestation manifest
2. If the Referrers API is not supported by the registry, via the Referrers Tag Schema, which creates a `my.registry.io/my-namespace/my-image:sha256-<image digest>` **manifest list** where the attestation manifest is one entry
3. If the Referrers API is supported by the registry, via the Referrers API, where no new tags are created
4. If using BuildKit with Docker (see below), by embedding the attestation manifest in the `my.registry.io/my-namespace/my-image:my-tag` manifest list

Cosign makes this configurable with the `COSIGN_EXPERIMENTAL` environment variable.
When the OCI v1.1 specs are released the default behavior will probably be #3 with #2 as fallback.

## Rebase

During `rebase`, the lifecycle should verify attestations for the old application image, and remove any attestations where the subjects are no longer valid
when signing the new image digest
(e.g., if the subject references a layer in the old run image that is no longer present, the attestation will be removed).

It should optionally accept configuration for new attestations to describe the new run image (or whatever else the platform wants to add).

## Next builds

The `analyzer` will accept `cosign` configuration that will allow it to verify attestations.
If no configuration is provided, verification will not be attempted.

During `analyze`, the lifecyle should verify attestations for the previous application image, and download the SBOM data as files in `<layers>/sbom/launch/`
so that the `restorer` can behave just as it does today when recreating `<layers>/<buildpack-id>/<layer>.sbom.<ext>` files for buildpacks.

The lifecycle should fall back to pulling the SBOM layer from the previous image if no attestations exist
(this will be necessary to keep compatibility with daemon images).

## Consuming an SBOM

Today's method looks like:

```bash
pack sbom download <image-name>
```

This looks for the SBOM as a layer within the application image.
We can update this command to optionally take `cosign` configuration that would allow signed attestations to be validated.
Something like:

```bash
pack sbom download \
  --cosign-key=cosign.pub \
  <image-name>
```

Or for keyless signing:

```bash
pack sbom download \
  --cosign-certificate-identity-regexp=<workflow file regexp> \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  <image-name>
```

# Migration
[migration]: #migration

Platforms can choose to do nothing when upgrading to the Platform API version that supports this change.
They will continue to obtain application images with an embedded SBOM layer, and nothing will be signed.

Platforms can invoke the `signer` while keeping the old export behavior, so that SBOMs will effectively reside in two places
(within the application image and as a separate artifact on the registry),
which will give SBOM consumers some time to update their workflows to the new `pack sbom download` invocation or comparable method.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

As always, it's a lot of work - and despite there being more consensus now than there was two years ago, the industry is still evolving here.
We might implement something only to want to change it soon after.
However, it's fair to say that our current way of doing things is fairly outdated at this point.

# Alternatives
[alternatives]: #alternatives

## BuildKit

Docker (via BuildKit) allows attestations to be attached to an image via a manifest list (see [here](https://docs.docker.com/build/attestations/attestation-storage/#image-attestation-storage)).
In [Example 1](https://github.com/buildpacks/rfcs/blob/refactor-sbom/text/0000-refactor-sbom.md#example-1---image-scoped-sbom-file) above,
the same in-toto statement would be created, but rather than being serialized as a DSSE envelope, it would simply be saved as a layer in an OCI image manifest that looks like:

```json
{
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "schemaVersion": 2,
  "config": {
    "mediaType": "application/vnd.oci.image.config.v1+json",
    "digest": "sha256:s0m3d1g3st",
    "size": 123
  },
  "layers": [
    {
      "mediaType": "application/vnd.in-toto+json",
      "digest": "sha256:s0m3d1g3st",
      "size": 1234,
      "annotations": {
        "in-toto.io/predicate-type": "https://cyclonedx.org/bom"
      }
    }
  ]
}
```

And the attestation manifest would be attached to the image it describes via an image index that looks like:

```json
{
  "mediaType": "application/vnd.oci.image.index.v1+json",
  "schemaVersion": 2,
  "manifests": [
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:$IMAGE_DIGEST",
      "size": 1234,
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      }
    },
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:s0m3d1g3st",
      "size": 1234,
      "annotations": {
        "vnd.docker.reference.digest": "sha256:$IMAGE_DIGEST",
        "vnd.docker.reference.type": "attestation-manifest"
      },
      "platform": {
         "architecture": "unknown",
         "os": "unknown"
      }
    }
  ]
}
```

`cosign` currently does not support downloading attestations that have been associated this way, but maybe it could (see discussion on this [issue](https://github.com/sigstore/cosign/issues/2688)).

We would probably want to explore directly integrating with BuildKit (see this [issue](https://github.com/buildpacks/pack/issues/768) and others) before trying to add support for this workflow.
But, nothing in this RFC precludes anything we might do here.

TODO: what about OCI layout images?

## What other designs have been considered?

## Why is this proposal the best?

The proposed configuration for the `signer` is generic enough that platforms could inject other kinds of attestations as necessary,
such as [SLSA provenance attestations](https://slsa.dev/spec/v1.0/provenance) or others.

## What is the impact of not doing this?

SBOMs for CNB-built images feel clunky and outdated.

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
  - Merging data from buildpacks-produced SBOM files together
  - Scanning to produce additional SBOM files that would also need to be attached

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