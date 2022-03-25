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

This RFC proposes a mechanism for platforms to supply the SBOM for a run image at build time, leaving the method of storing and associating the SBOM to the run image unspec'd. The lifecycle would ingest the provided SBOM and place it in a spec'd location in the final app image. A label would be used to designate the layer containing the SBOM for the run image.

- Define the target persona: platform operator, platform implementor, end user.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
  - The lifecycle could warn if a usable run image sbom is not provided.

Example invocation:
* build: `/cnb/lifecycle/exporter -run-image my-run-image -run-image-sbom <path or directory - e.g., ./my-run-image-sbom.json> my-app-image`
* rebase: `/cnb/lifecycle/rebaser -run-image my-new-run-image -run-image-sbom <path or directory - e.g., ./my-new-run-image-sbom.json> my-app-image`

# How it Works
[how-it-works]: #how-it-works

## Build

Following the build invocation above, the exported app image would contain:
* `my-run-image-sbom.json` somewhere in `/layers/sbom`; suggestions:
  * `/layers/sbom/launch/base/sbom.<ext>` (this would make `base` a reserved buildpack id)
  * `/layers/sbom/launch/run-image/sbom.<ext>` (this would make `run-image` a reserved buildpack id)
  * `/layers/sbom/run-image/sbom.<ext>`
  * ?
* An `io.buildpacks.sbom.base` label containing the diffID of the layer containing the run image sbom

The accepted media types would be:
* `application/vnd.cyclonedx+json` with ext `cdx.json`
* `application/spdx+json` with ext `spdx.json`
* `application/vnd.syft+json` with ext `syft.json`
* others?

## Rebase

Following the rebase invocation above, the exported app image would contain:
* `my-new-run-image-sbom.json` somewhere in `/layers/sbom`
* The layer containing the old run image sbom would be removed
* The `io.buildpacks.sbom.base` label would be updated to contain the diffID of the layer containing the new run image sbom

## When a run image has an sbom baked in

A platform could provide a run image that already has an sbom baked in - i.e., has a layer containing an sbom that is advertised in `io.buildpacks.sbom.base`. In this case, the lifecycle could just do nothing, and the final app image would contain an sbom in the expected location with the expected label. This (as in #186) runs the risk that the sbom baked into the run image has fallen out of date.

If a platform provided a run image with a baked in sbom and also supplied the `-run-image-sbom` argument, the lifecycle could replace the baked in sbom with the new sbom, much like rebase.

## With Dockerfiles

https://github.com/buildpacks/rfcs/pull/173 proposes allowing the run image to be extended or swapped using Dockerfiles. There are a few scenarios that could occur:
* The run image is extended - the lifecycle would need to run a `genpkgs` executable after Dockerfiles have been applied. The result of this invocation would replace the `io.buildpacks.sbom.base` label on the extended run image. In this scenario, the build would proceed according to the process outlined in "When a run image has an sbom baked in".
* The run image is swapped for a new run image that already has a `io.buildpacks.sbom.base` label. In this scenario, the lifecycle would NOT run `genpkgs`, and the build would proceed according to the process outlined in "When a run image has an sbom baked in".
* The run image is swapped for a new run image that does not have a `io.buildpacks.sbom.base` label. In this scenario, there are a couple things that could occur:
  * The lifecycle could run `genpkgs` to produce a run image sbom for use during export
  * The lifecycle could return the new run image reference to the platform, expecting the platform to locate an sbom

## With pack

`pack` could make use of the preparer binary described below to download a run image sbom prior to running the exporter. When Dockerfiles are supported, the preparer invocation would need to happen after the `extender` has run to cover the case where a new run image is selected.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this? Leaving the location of the run image sbom unspec'd (as opposed to baking it into the run image at a specific location) could make it harder for logic-less platforms like Tekton to use the creator.

## preparer binary
* A possible mitigation to the drawback noted above would be a CNB-provided "prepare" operation ([currently under discussion](https://github.com/buildpacks/rfcs/pull/202)). For example, a preparer could look for a run image sbom in a file, attestation, attachment, or layer (picking the first one it finds) and provide the data as a file to the creator. The Tekton task that uses the creator currently already has a ["prepare" step](https://github.com/tektoncd/catalog/blob/4bf8b57aa105f0c7ce05fc122a11b1b0d5822fcd/task/buildpacks/0.3/buildpacks.yaml#L70-L121) which could be modified to invoke a preparer binary.

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
- How should the layer containing the run image sbom be designated? This layer containing the buildpack-provided sbom is referenced in the `io.buildpacks.lifecycle.metadata` label with key `sbom`. #186 proposed `io.buildpacks.base.sbom` for the layer containing the run image sbom, and `io.buildpacks.app.sbom` for the layer containing the buildpack-provided sbom (in addition to `io.buildpacks.lifecycle.metadata`).
- What should be all the accepted media types / extensions?

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
  - The existence or behavior of a preparer binary that knows how to download run image sboms.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? New fields on the exporter and rebaser. A new label on the app image to designate the layer containing the run image sbom.
