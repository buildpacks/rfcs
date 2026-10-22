# Meta
[meta]: #meta
- Name: Run Image Structured SBOM
- Start Date: 2021-10-25
- Author(s): aemengo
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes the following -

- A run image can contain a single layer holding an SBOM (in format of CycloneDX or SPDX or Syft) of installed packages at `/cnb/sbom/bom.<ext>.json`, where `<ext>` will be `cdx` for CycloneDX documents, `spdx` for SPDX documents, and `syft` for Syft documents. These will initially be the only 3 supported SBOM types.
- The diffID of this layer is written as a `LABEL` on the corresponding run image with the key: `io.buildpacks.base.sbom`.
- For the sake of parity, the diffID of buildpack SBOM layers (created by lifecycle) is written as a `LABEL` on the corresponding run image with the key: `io.buildpacks.app.sbom`.

# Definitions
[definitions]: #definitions

- SBOM (Software Bill Of Materials) / BOM: A list of components in a piece of software. Software vendors often create products by assembling open source and commercial software components. The SBOM describes the components in a product. In case of buildpacks the SBOM describes the contents of the various layers, buildpacks, stacks and the output app container.
- Run Image: A container image that serves as a base image for application images in the buildpack toolchain.

# Motivation
[motivation]: #motivation

This RFC serves as an addendum to [#RFC 95: SBOM](https://github.com/buildpacks/rfcs/blob/main/text/0095-sbom.md) which introduces the SBOM for buildpack installed packages. For a full depiction of packages within a container image, container scanning tools would _also_ need an SBOM of the installed OS packages. These multiple SBOM files would be merged as part of the lifecycle build process, for easy consumption by an automated scanning tool.

# What it is
[what-it-is]: #what-it-is

A stack creator is permitted to specify a SBOM for a given run image, in one discrete layer, at the following file path:

```shell
/cnb/sbom
└── bom.<ext>.json
```

And a label with key of `io.buildpacks.base.sbom`, and value of the diffID of this layer, stored as metadata on the run image.

With this label specified, the rebase operation can be augmented to reference the new sBOM layer for the intended application image.

Merging BOM files, whether files of the same format or files of different formats, is out of scope for this RFC. It would require its own separate RFC.

## Tooling

To facilitate adherence to this specification, the CNB project will create tooling that consumes a given run container image and a given SBOM json file, to create a new image with the SBOM information embedded at the correct location and diffID metadata attached. This allows for generation of SBOM files both within the image and outside it.

# Drawbacks
[drawbacks]: #drawbacks

This RFC tries to thrust a paradigm which is an even greater burden on stack operators, in light of the recently approved [#RFC 96: Remove Stacks](https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md).

# Alternatives
[alternatives]: #alternatives

    -

# Prior Art
[prior-art]: #prior-art

- [#RFC 95: SBOM](https://github.com/buildpacks/rfcs/blob/main/text/0095-sbom.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

    -

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

- The [platform.md#run-image](https://github.com/buildpacks/spec/blob/main/platform.md#run-image) would need an addition for the `io.buildpacks.base.sbom` key, referencing the layer diffID that holds the run-image BOM.
- The [platform.md#labels](https://github.com/buildpacks/spec/blob/main/platform.md#labels) would need an addition for the `io.buildpacks.app.sbom` key, referencing the app image layer diffID that holds the buildpack BOM.
