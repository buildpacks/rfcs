# Meta
[meta]: #meta
- Name: Run Image SBOM
- Start Date: 2022-03-09
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpacks/rfcs/pull/186

# Summary
[summary]: #summary

This RFC proposes a mechanism for platforms, when running builds, to provide an sbom for the run image that will be included in the final app image.

# Definitions
[definitions]: #definitions

- Run Image: A container image that serves as a base image for application images in the buildpack toolchain.
- SBOM (Software Bill Of Materials) / BOM: A list of components in a piece of software. Software vendors often create products by assembling open source and commercial software components. The SBOM describes the components in a product. In case of buildpacks the SBOM describes the contents of the various layers, buildpacks, base images and the output app container.
- Attestation: authenticated metadata about one or more software artifacts, as per the SLSA Attestation Model (see [here](https://github.com/in-toto/attestation) and [here](https://github.com/sigstore/cosign#in-toto-attestations)).
- Cosign sbom attachment: an sbom object represented as an OCI Image Manifest V1 (see [here](https://github.com/sigstore/cosign/blob/main/specs/SBOM_SPEC.md)).

# Motivation
[motivation]: #motivation

This RFC serves as an addendum to [#RFC 95: Structured SBOMs](https://github.com/buildpacks/rfcs/blob/main/text/0095-sbom.md), which introduced a structured way for buildpacks to provide an sbom for dependencies installed at build time. For a full depiction of dependencies within a container image, container scanning tools would _also_ need an sbom for OS packages that were installed on the run image when it was created.

# What it is
[what-it-is]: #what-it-is

- Define the target persona: platform operator, platform implementor, end user.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
  - The lifecycle could warn if a usable run image sbom is not provided.

Example invocation: `/cnb/lifecycle/exporter -run-image my-run-image -run-image-sbom my-run-image-sbom.json my-app-image`

# How it Works
[how-it-works]: #how-it-works

Following the invocation above, the exported app image would contain:
* `my-run-image-sbom.json` somewhere in `/layers/sbom`; suggestions:
  * `/layers/sbom/launch/run-image/sbom.<ext>` (this would make `run-image` a reserved buildpack id)
  * `/layers/sbom/run-image/sbom.<ext>`
  * ?

The accepted media types would be:
* `application/vnd.cyclonedx+json` with ext `cdx.json`
* `application/spdx+json` with ext `spdx.json`
* `application/vnd.syft+json` with ext `syft.json`
* others?

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this? Leaving the location of the run image sbom unspec'd could make it harder for logic-less platforms like Tekton to use the creator. However, a CNB-provided "prepare" operation ([currently under discussion](https://github.com/buildpacks/rfcs/pull/202)) could make this easier. For example, a preparer could look for a run image sbom in a file, attestation, attachment, or layer (picking the first one it finds) and provide the data as a file to the creator. The Tekton task that uses the creator currently already has a ["prepare" step](https://github.com/tektoncd/catalog/blob/4bf8b57aa105f0c7ce05fc122a11b1b0d5822fcd/task/buildpacks/0.3/buildpacks.yaml#L70-L121) which could be modified to invoke a preparer binary.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered? [Adding the sbom as a layer](https://github.com/buildpacks/rfcs/pull/186) to the run image and adding its diffID as a label. Some [concerns](https://github.com/buildpacks/rfcs/pull/186#issuecomment-1043348097) with this proposal included:
  * Special tooling is required to create the run image (because we don't know the diffID ahead of time)
  * The run image may [fall out of date](https://github.com/buildpacks/rfcs/pull/186#discussion_r773246636) in a way that is not obvious
  * We don't want to "pick a winner" just yet for the mechanism for attaching sboms to the run image
- Why is this proposal the best? This frees platforms to choose their own method of attaching sboms to the run image, while providing a standardized way to consume a complete sbom for the app image.
- What is the impact of not doing this? Each platform will have to come up with its own way of attaching run image sboms to the app image.

# Prior Art
[prior-art]: #prior-art

- [#RFC 95: Structured SBOMs](https://github.com/buildpacks/rfcs/blob/main/text/0095-sbom.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What should be the path of the run image sbom within the image?
- How should the layer containing the run image sbom be designated? This layer containing the buildpack-provided sbom is referenced in the `io.buildpacks.lifecycle.metadata` label with key `sbom`.
- What should be all the accepted media types / extensions?

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
  - The existence or behavior of a preparer binary that knows how to download run image sboms.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? New fields on the exporter and rebaser. A new label on the app image to designate the layer containing the run image sbom.
