# Meta
[meta]: #meta
- Name: BOM inclusion in layer content metadata
- Start Date: 2021-04-01
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes the inclusion of a `BOM` (Bill-of-materials) table in layer content metadata TOML files (`<layer-name.toml>`). This would allow the `BOM`s generated from a layer to have the same lifetime as the layer itself and avoid various gotchas that happen currently as a result of the BOM being defined in the `launch.toml` or `build.toml`.

# Motivation
[motivation]: #motivation

## Why should we do this?

Currently `BOM` is a buildpack level entity and has to be defined in either the `launch.toml` or the `build.toml`. This presents several limitations which may be alleviated the this proposal.

Often times `BOM` describes the artifacts present in the layer. Having this present in the `launch.toml` or `build.toml` which are ephemeral between builds means that the `BOM` has to be generated for each build, even if the layer itself has not changed and is cached. 

This leads to surprising behaviors for users at times when they may be generating a `BOM` as part of the layer generation process and may find that their `BOM` is missing if the `BOM` generation process is not called when the layer is assumed to be cached.

Having the `BOM` be a part of the layer content metadata also means that we can pin-point which layer contributed a BOM entry without having to implement extra logic in downstream buildpacks.

- What is the expected outcome?

The lifecycle is able to generate the final `BOM` by combining the `BOM` entries from top level metadata files like `launch.toml` and `build.toml` and also the ones from `<layer-name>.toml` which handling layer caching correctly i.e. if the layer is cached and re-used in the new build - the `BOM` associated with that layer will also be re-used.

# What it is
[what-it-is]: #what-it-is

The layer content metadata files would be updated to include - 

```
[[bom]]
name = "<dependency name>"

[bom.metadata]
# arbitrary metadata describing the dependency
```

For each dependency contributed to the app image or build environment, the buildpack layer:

- SHOULD add a bill-of-materials entry to the bom array describing the dependency, where:
  - name is REQUIRED.
  - metadata MAY contain additional data describing the dependency.
  
The buildpack SHOULD NOT add bom to a layer content metadata file describing the contents that are not contributed by the same layer. `BOM` entries that describe contribution to the application directory should go in the buildpack-level `BOM` entries in `launch.toml` or `build.toml`.

# How it Works
[how-it-works]: #how-it-works

The lifecycle would be responsible for the generation of the appropriate metadata files and labels given partial `BOM` entries in the `launch.toml`, `build.toml` and `<layer-name>.toml`. The generation of these artifacts given `BOM` entries in `<layer-name>.toml` would be controlled as follows - 

- If the layer has `types.launch` set to `true` then all the `bom` entries will be contributed to the app image in `io.buildpacks.build.metadata` and `<layers>/config/metadata.toml`.
- If the layer has `types.build` set to `true` then all the `bom` entries will be written to `report.toml`.
- If the layer has `types.cache` set to `true` and if the layer is reused in the next build, the respective `bom` entries should be re-populated from the cached layer content metadata file.
- If `types.cache` is set to `false`, but `types.launch` is set to `true` before a rebuild, the layer content metdata file should be restored with the `BOM` section. If the buildpack sets `types.launch` to `true` after the re-build, the final value of `bom` after the re-build should be used.
- If neither `types.launch` or `types.build` are set to `true` but the layer is present during the export phase the `bom` entries should STILL be written to `report.toml` as the contents of this layer may have been used to generate other artifacts in the same buildpack and someone went through the effort of adding these entries to the `bom`. 

All `bom` entries should respect any combination of the above.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

Additional complexity and utility pushed down to the lifecycle.

# Alternatives
[alternatives]: #alternatives

Keep it as it is and provide a similar functionality in language bindings like `libcnb`. Currently the layer content metadata files are already being used to store and regenerate the `BOM` in buildpacks from the `paketo` project.

# Prior Art
[prior-art]: #prior-art

The paketo Java buildpacks regenerate the BOM everytime even if the layer is reused.


1. `libpak`  has logic to autogenerate BOM entries for certain types of layers, and it uses the layer types to determine whether it needs a launch or build BOM entry - https://github.com/paketo-buildpacks/libpak/blob/a7abf79a2a53ada27c56d48db765454405ab8259/layer.go#L139-L148
2. It also includes the layer name in the BOM metadata.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

A new array of tables `[[bom]]` to be added to the layer content metadata files  - 

```toml
[types]
  launch = false
  build = false
  cache = false

[metadata]
# buildpack-specific data

[[bom]]
name = "<string>"

[bom.metadata]
# Additional metadata
```

A new layer key should be added to the `bom` entries in `io.buildpacks.build.metadata`, `metadata.toml` and `report.toml` -

Example - 

```json
{
  "processes": [
    {
      "type": "<process-type>",
      "command": "<command>",
      "args": [
        "<args>"
      ],
      "direct": false
    }
  ],
  "buildpacks": [
    {
      "id": "<buildpack ID>",
      "version": "<buildpack version>",
      "homepage": "<buildpack homepage>"
    }
  ],
  "bom": [
    {
      "name": "<bom-entry-name>",
      // This key should be absent if the BOM was provided
      // in launch.toml or build.toml instead of <layer>.toml
      "layer": "<layer-name>",
      "metadata": {
        // arbitrary buildpack provided metadata
      },
      "buildpack": {
        "id": "<buildpack ID>",
        "version": "<buildpack version>"
      }
    },
  ],
 "launcher": {
    "version": "<launcher-version>",
    "source": {
      "git": {
        "repository": "<launcher-source-repository>",
        "commit": "<launcher-source-commit>"
      }
    }
  }
}
```