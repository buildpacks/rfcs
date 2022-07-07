# Meta

[meta]: #meta

- Name: SBOM for lifecycle / launcher
- Start Date: 2022-06-27
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary

[summary]: #summary

Today, SBOMs produced for CNB-built images do not include information describing the CNB lifecycle itself - including
the launcher, a component in the final image. This RFC proposes a mechanism by which the lifecycle can provide an SBOM
describing itself (as a build-time dependency) and the launcher (as a runtime dependency).

# Definitions

[definitions]: #definitions

SBOM: A list of components in a piece of software. Software vendors often create products by assembling open source and
commercial software components. The SBOM describes the components in a product.

lifecycle: software that orchestrates a CNB build.

launcher: an executable that is the `ENTRYPOINT` of the exported OCI image. It is used to start processes at runtime.

# Motivation

[motivation]: #motivation

- Why should we do this? A more complete SBOM for CNB-built images.
- What use cases does it support? As an end user, I want SBOM information for every component of my software supply
  chain.

# What it is

[what-it-is]: #what-it-is

The SBOM for a CNB-built image could be broken down as follows:

* **Base image dependencies**
    * The platform is responsible for providing SBOM information (see the closure
      of https://github.com/buildpacks/rfcs/pull/211 in favor of https://github.com/buildpacks/rfcs/pull/195). Out of
      scope for this RFC.
* **Buildpack-provided dependencies**
    * SBOM files output by buildpacks are copied to `<layers>/sbom/build/<buildpack-id>`
      and `<layers>/sbom/run/<buildpack-id>`. `<layers>/sbom/run` is a layer in the final image.
      See [RFC 0095](https://github.com/buildpacks/rfcs/blob/main/text/0095-sbom.md).
* **CNB lifecycle**
    * Currently there is no SBOM information associated to the image. A CycloneDX SBOM is included in lifecycle
      [releases](https://github.com/buildpacks/lifecycle/releases), but it is left up to individual end users to locate
      this information. The subject of this RFC.

## Proposed Changes:

* The lifecycle will ship with SBOM files in CycloneDX, SPDX, and Syft formats.
    * [Lifecycle images](https://hub.docker.com/r/buildpacksio/lifecycle) will include the following SBOM files:
        * `/cnb/lifecycle/lifecycle.sbom.cdx.json`
        * `/cnb/lifecycle/lifecycle.sbom.spdx.json`
        * `/cnb/lifecycle/lifecycle.sbom.syft.json`
        * `/cnb/lifecycle/launcher.sbom.cdx.json`
        * `/cnb/lifecycle/launcher.sbom.spdx.json`
        * `/cnb/lifecycle/launcher.sbom.syft.json`
    * Analogously, [lifecycle tarballs](https://github.com/buildpacks/lifecycle/releases) will include these files
      rooted at `./lifecycle` - e.g., `/cnb/lifecycle/lifecycle.sbom.cdx.json` above will
      be `./lifecycle/lifecycle.sbom.cdx.json` in the tarball.

* Builder authors should include the new SBOM files in builder images.
    * There shouldn't be any changes required to `pack builder create` as `pack` takes a lifecycle tarball as an input,
      and the files will be there in the tarball.

* Before `export`, the lifecycle will copy the above files to:
    * `/cnb/lifecycle/lifecycle.sbom.cdx.json`  -> `<layers>/sbom/build/buildpacksio_lifecycle/sbom.cdx.json`
    * `/cnb/lifecycle/lifecycle.sbom.spdx.json` -> `<layers>/sbom/build/buildpacksio_lifecycle/sbom.spdx.json`
    * `/cnb/lifecycle/lifecycle.sbom.syft.json` -> `<layers>/sbom/build/buildpacksio_lifecycle/sbom.syft.json`
    * `/cnb/lifecycle/launcher.sbom.cdx.json`   -> `<layers>/sbom/launch/buildpacksio_lifecycle/launcher/sbom.cdx.json`
    * `/cnb/lifecycle/launcher.sbom.spdx.json`  -> `<layers>/sbom/launch/buildpacksio_lifecycle/launcher/sbom.spdx.json`
    * `/cnb/lifecycle/launcher.sbom.syft.json`  -> `<layers>/sbom/launch/buildpacksio_lifecycle/launcher/sbom.syft.json`

* `buildpacksio/lifecycle` will become a reserved buildpack ID

* The `exporter` when adding the launcher layer should use the layer ID `buildpacksio/lifecycle:launcher`, instead
  of `launcher` (what it is today). This provides a clear mapping between layer IDs and SBOM paths.
    * For consistency, we may also wish to update the IDs for the `launch.sbom`, `config`, and `process-types` layers to
      have the prefix `buildpacksio/lifecycle:`, even though these layers have no associated SBOM.

* Because they are a part of `<layers>/sbom/launch`, SBOM files describing the launcher will be exported in the final
  image.
    * SBOM files in `<layers>/sbom/build` may be saved off by the platform before the build container exits (no changes
      to the existing workflow).

* If no SBOM files are found in `/cnb` (e.g., if the builder author did not include them), the lifecycle will warn and
  continue. Alternatively, the lifecycle could generate the files on the fly, but this would increase build times.
    * If there is a previous image, `<layers>/sbom/launch/buildpacksio_lifecycle` may contain SBOM files - but these
      should be deleted before `export` as there is no guarantee that the lifecycle that created the previous image is
      the same as the current lifecycle.

* In theory, there should be no changes needed for end-users to consume the new SBOM files, as the files will be placed
  in the same directory, with the same structure, as SBOM files for buildpack-provided dependencies.

# Drawbacks

[drawbacks]: #drawbacks

Why should we *not* do this? More work for the lifecycle.

# Alternatives

[alternatives]: #alternatives

- What other designs have been considered?
    - This could all be implemented with a buildpack - e.g., a `buildpacksio/lifecycle` utility buildpack whose sole
      responsibility would be to copy the SBOM files from `/cnb/lifecycle` to `<layers>/sbom`. However, this would
      introduce quite a bit of complexity and overhead for what is ultimately a very simple operation. A potential
      benefit is that platforms using Platform API `0.8` and higher wouldn't need to upgrade - but they would need to
      add the new utility buildpack to builders, which is probably just as much work.
    - In theory, we don't actually need the files to be in `<layers>/sbom/<build|launch>/buildpacksio_lifecycle` -
      because any files restored from a previous build will be ignored (see above). They could be annotations or
      attestations on the image instead (see https://github.com/buildpacks/rfcs/pull/195) - but this would require
      platforms to keep track of the files as inputs to the signer binary.

- Why is this proposal the best? It is easy and straightforward for the lifecycle to copy pre-generated files
  to `<layers>/sbom/<build|launch>/buildpacksio_lifecycle`.

- What is the impact of not doing this? A less complete SBOM for CNB-built images.

# Prior Art

[prior-art]: #prior-art

Discuss prior art, both the good and bad.

* RFCs:
    * Base image dependencies: https://github.com/buildpacks/rfcs/pull/211, https://github.com/buildpacks/rfcs/pull/195
    * Buildpack-provided dependencies: [RFC 0095](https://github.com/buildpacks/rfcs/blob/main/text/0095-sbom.md)

# Unresolved Questions

[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved through implementation of the feature?
    - Tooling or libraries used by the lifecycle to generate SBOM files describing itself.

# Spec. Changes (OPTIONAL)

[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.

The platform spec should make mention of the new SBOM files. The buildpack spec should note
that `buildpacksio_lifecycle` is a reserved buildpack ID.

The `exporter` and the `creator` will accept a new flag, `-launcher-sbom`, for a directory containing SBOM files for a
provided `-launcher`. The lifecycle will warn if `-launcher` is provided without `-launcher-sbom`. The lifecycle will
ignore `-launcher-sbom` if no `-launcher` is provided.
