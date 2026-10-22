# Meta
[meta]: #meta
- Name: SBOM attachment - OCI v1.1 spec
- Start Date: 2023-02-24
- Author(s): harsh
- Status: draft
- RFC Pull Request: wip
- CNB Pull Request: n/a
- CNB Issue: n/a
- Supersedes: n/a

# Summary
[summary]: #summary

Currently, SBOM(s) in buildpack produced images don't have them attached to the resulting OCI artifact as a dedicated layer with IANA-registered media types. OCI v1.1 specification recommends to do so as it would make [other tools](https://github.com/sigstore/cosign/blob/main/specs/SBOM_SPEC.md) in the ecosystem interoperable with each other. 

# Definitions
[definitions]: #definitions


- [SBOM(software bill of materials)](https://www.cisa.gov/sbom) -- A SBOM is a nested inventory, a list of ingredients that make up software components
- [OCI Artifact](https://github.com/opencontainers/artifacts/blob/main/definitions-terms.md#media-type) -- Any blob of data that can be stored in an OCI registry. From the spec:
> An artifact has a type, which has a collection of layers. The Artifact is defined as unique by its `manifest.config.mediaType`. Layers are defined by their `layer.config.mediaType`.

# Motivation
[motivation]: #motivation

As an end user, it would be easy to use a single tool to interact with OCI artifacts for SBOM information- to enable that, the build tools in the ecosystem would need to comply to the specification. 

# What it is
[what-it-is]: #what-it-is

This change allows an end user to view the OCI manifest of buildpack produced image and find a dedicated SBOM layer within it.  For example,


```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": {
    "mediaType": "application/vnd.dev.cosign.artifact.sbom.v1+json",
    "size": 669,
    "digest": "sha256:b5af1565ca06a6163b8712cbfa653a712774280856639bc1eee5a1ca7ba99b7d"
  },
  "layers": [
    {
      "mediaType": "application/vnd.syft+json",
      "size": 621,
      "digest": "sha256:4b6da9488c8c58b0cf2a6ab17ec6c1f61c253c72fae89058e0f36a9d2b56ff38"
    },
    {
      "mediaType": "text/spdx+json",
      "size": 3154,
      "digest": "sha256:ccd7ff261d5506b9345c0b066b903bd0ef2d8ccd9f833ce738773d19c57f517e"
    },
}
```

This will also tools like [Cosign](https://github.com/sigstore/cosign) that are not maintained by Buildpack community to seamlessly support SBOM interaction with it.

# How it Works
[how-it-works]: #how-it-works


To seamlessly integrated with existing builder-images, it might be best to have the [lifecycle binary](https://github.com/buildpacks/lifecycle) add the SBOM layers to the resulting image in the Exporter phase. Lifecycle has access to the layers directory. At a high level, it has to :
* Find the SBOMs produced in the layers directory
* Attach SBOMs to the image before publishing it

Here's a [simple Go](https://github.com/RealHarshThakur/attach-sbom) program that does that by:
* Accpeting a buildpack produced image 
* Layers directory (downloaded through  `pack sbom download`)


From implementation perspective, this will have to be split up into [imgutil](https://github.com/buildpacks/imgutil/blob/main/image.go#L36) package which lifecycle uses in Export phase. 


# Migration
[migration]: #migration

N/a


# Drawbacks
[drawbacks]: #drawbacks

None that I can think of

# Alternatives
[alternatives]: #alternatives

N/a

# Prior Art
[prior-art]: #prior-art

Similar work has been done already in [Cosign](https://github.com/sigstore/cosign/pull/2684)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
N/a

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This doesn't break the existing spec nor does it require builder imaages to add any new features. 

