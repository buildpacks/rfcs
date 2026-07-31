# Meta
[meta]: #meta
- Name: Cosign support
- Start Date: 2021-12-03
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Adds image signing support to Buildpacks natively using cosign.

# Definitions
[definitions]: #definitions

- cosign: A sigstore project to sign container images - https://github.com/sigstore/cosign
- SBOM: Software Bill-of-Materials


# Motivation
[motivation]: #motivation

Supply chain security has been on top of everyone's minds in 2021. It is important to ensure the integrity and origin of software artifacts in order to have a secure supply chain. Sigstore's cosign has quikcly risen to become the defacto container signing solution. This RFC proposes that we natively add cosign support to the lifecycle to facilitate easy signed container artifacts as part of the build process.

# What it is
[what-it-is]: #what-it-is

An new phase `signer` which can be optionally run after the `exporter` if the image was exported to an OCI registry. The `signer` takes in the `report.toml` produced by the `exporter` and a `cosign.toml` file as flags. The interface would look like `/cnb/signer -report <report.toml> -cosign-config <cosign.toml>`.

The schema for `cosign.toml` will look like the following - 

```toml
# A static list of annotations to add to each signature config
[[annotations]]
name = "<name>"
value = "<value>"

[[annotations]]
name = "<name2>"
value = "<value2>"

# multiple cosign configs can be specified
[[configs]]
# path to private key
key = "<path-to-key>"
# optional value for COSIGN_REPOSITORY, optional, default:""
repository = "<cosign-repository>"
# value for COSIGN_DOCKER_MEDIA_TYPES, optional, default:false
docker-media-types = true
# optional path to password file. Contents will be used as COSIGN_PASSWORD
password = "<path-to-password-file>"
# optional flag to export sbom as attestations or attachement if SBOM is present in the 0.7+ format, default:attestation.
export-sbom = `none|attestation|attachment`
```
The `signer` will do the following - 

- Verify that it has read access to the registries where the output images from `exporter` are stored and that their digests match the ones in `report.toml`
- Verify that it has write access to the registries where it needs to output the signatures and attestations.
- Generate cosign signatures for all the images along with the provided annotations.
- If `export-sbom` is set to a value not equal to `none`, export the sbom accordingly as a cosign attestation or an attachment depending on the value. The default value is `attestation`. The SBOM will be fetched from the output image in the registry stored as defined in the platform API.

# How it Works
[how-it-works]: #how-it-works

The `signer` can use `cosign` as a library to generate, attach and publish signatures for the output image. `cosign` exposes a GGCR compatible interface which should fit nicely with the lifecycle.


# Drawbacks
[drawbacks]: #drawbacks

Increased complexity in lifecycle

# Alternatives
[alternatives]: #alternatives

Add cosign support to pack.


# Prior Art
[prior-art]: #prior-art

- https://github.com/buildpacks/pack/issues/268
- https://github.com/buildpacks/pack/issues/934
- https://github.com/pivotal/kpack/blob/main/rfcs/0007-cosign-integration.md


# Unresolved Questions
[unresolved-questions]: #unresolved-questions


How to deal with daemon case? I am of the opinion that we should deprecate daemon flag in lifecycle and instead switch to OCI but that can come later.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes


Noted above.
