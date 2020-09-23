# Meta
[meta]: #meta
- Name: Offline Buildpackages
- Start Date: 2020-04-27
- Author(s): dwillist
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: NA

# Summary
[summary]: #summary

This change allows buildpacks to access vendored assets during builds to enable offline builds and asset reuse.

To do so we introduce the asset package, a distribution artifact that provides vendored assets for buildpacks, and platform mechanisms to provide vendored assets to buildpacks during `build` and `detect`.

# Motivation
[motivation]: #motivation

- Simplify artifacts needed to achieve offline builds.
- Enable registry deduplication of buildpack assets
- Separate buildpacks from vendored assets.

# What it is
[what-it-is]: #what-it-is

### Define the target persona:
Buildpack user, Platform operator, Buildpack author

### Explaining the feature largely in terms of examples.
We define the asset package. Which is a reproducible OCI image. Each layer in this image contains one or more `asset` files that a buildpack may want to contribute during a build. Each of these `asset` files will be made available at `/cnb/assets/<asset-sha256>.extension` in the build container.

Asset Package Layers Layout:
```
<layer1> ┳━ /cnb/assets/<java11-asset-sha256>.tgz
         ┗━ /cnb/assets/<java13-asset-sha256>.tar

...
<layern> ━━ /cnb/assets/<java15-asset-sha256>.zip
```

Asset packages will have a `io.buildpacks.asset.layers` Label. This label's contents will be a `json` object mapping each layer to metadata describing the assets it provides.

``` json
{
  "<layer1-diffID>": [
    {
      "sha256": "java11-asset-sha256",
      "uri": "https://path/to/java11.tgz",
      "additionalPaths": [
        "other/endpoint1",
        "other/endpoint2"
      ],
      "metadata": {}
    },
    {
      "sha256": "<java13-asset-sha256>",
      "additionalPaths": [],
      "metadata": {
        "name": "java13"
      }
    }
  ],
  "...": [],
  "<layern-diffID>": [
    {
      "sha256": "<java15-asset-sha256>",
      "uri": "/local/path/to/java15.zip",
      "additionalPaths": [],
      "metadata": {}
    }
  ]
}
```

We also add the `io.builpacks.buildpackage.assets` label to buildpackages. This will let buildpackages reference a set of asset packages, and allow the platform to make decisions about pulling in asset packages before a build.


The `io.buildpacks.buildpackage.assets` label will contain a `json` object with an `assets` field listing possible asset packages.

##### Buildpackage Label
[buildpackage-label]: #buildpackage-label
``` json
{
    "assets": [
        "gcr.io/buildpacks/java-asset-package",
        "https://buildpacks.io/asset-package-fallback/java.tgz",
        "urn:cnb:registry:buildpacks/java-asset-package"
    ]
}
```

Builders that contain asset packages will have an `io.buildpacks.asset.layers` with the same format as the asset package label.


# How it Works
[how-it-works]: #how-it-works

## Asset package creation

Asset Image creation will be handled by the platform. E.g. `pack package-asset <asset-image-name> --config <asset.toml>`

It requires a `asset.toml` file. This file has two methods to specify assets to be included in an asset package.
1) an entry in the `[[asset]]` array
2) including all assets from another asset package via an entry in the `[[include]]` array.

Each entry in the `[[asset]]` array may have the following fields defined:
  - `uri` (string), (required) local path or URL
  - `sha256` (string), (required) Must be unique. Used for validation and as an endpoint where an  asset will be provided.
  - `additional-paths` (array), endpoints where the platform should provide symlinks to the asset. This is provided for cases where `assets` require absolute paths.
  - `metadata` (arbitrary mapping)

Each entry in the `[[include]]` array must have one of the following fields defined
  - `image` (string), image name of an asset, domain name resolution is left to the platform.
  - `uri` (string), uri to an asset image archive.


#### Example
``` toml
[[asset]]
uri = "https://path/to/java11.tgz"
sha256 = "some-sha256"
additional-paths = ["other/endpoint1", "other/endpoint2"]

[[asset]]
uri = "/local/path/to/java13.tgz"
sha256 = "another-sha256"
  [metadata]
    name = "java13"

[[asset]]
uri = "/local/path/to/java15.tgz"
sha256 = "another-nother-sha256"

[[include]]
image = "gcr.io/ruby/asset-package:0.0.1"

[[include]]
uri = "https://nodejs/asset-package.tar"

```

Asset package creation should:
  - Transform all assets a image layer filesystem changeset where the asset is provided at `/cnb/assets/<artifact-sha256>`.
  - Add all additional-paths symlinks to the resultant image, in the case of path collisions fail.
  - Order all assets layers diffID.
  - Add `io.buildpacks.asset.layers` label metadata to the asset image.
  - set the created time in image config to a constant value.
  - set the modification time of all files in newly created layers to a constant value

## Using Asset Packages

Asset packages can be added to a build by three mechanisms
1) specify an asset package(s) using the `--asset` flag(s).
2) buildpackages on a builder may have asset package references in the `io.buildpacks.buildpackage.assets` label. If these assets are not in the builder the platform may pull to make them available for a build.
3) Assets package layers can be added to a builder image during its creation. These assets will then be available to all builds that use this builder.


When asset packages are added to a build/builder we need to verify the following:
  - Validate any two assets do not have a common element in `additionalPaths` that is linked to different `/cnb/assets/<asset-sha256>` locations.
  - If two assets provide the same `/cnb/assets/<asset-sha256>` these two files must have identical contents. Decisions about rewriting these layers to optimize space are left to the platform.

When creating a builder with asset packages:
  - Asset package layers should be the final k layers in the builder. These should be ordered by `diff-ID`.
  - If any asset layer is a superset of another, only the superset layer is included in the builder.
  - builders inherit a `io.buildpacks.buildpack.assets` Label containing entries for every asset layer included in the builder.

### Adding Asset Package references to a buildpackage

A new `[[asset-package]]` array is added to the `package.toml` file used to create buildpackages. The values in this array are used to fill out the `io.buildpacks.buildpackage.assets` label.

The following entries in a `package.toml` file would produce the Buildpackage labels in the above example.
```toml
[[asset-package]]
image = "gcr.io/buildpacks/java-asset-package"

[[asset-package]]
uri = "https://buildpacks.io/asset-package-fallback/java.tgz"

[[asset-package]]
image = "urn:cnb:registry:buildpacks/java-asset-package"
```

The platform may verify each `[[asset-package]]` exists when creating a buildpackage.

### `lifecycle` changes
The platform should now provide a `CNB_ASSETS` environment variable to the `build` and `detect phases`. This provides a standard variable buildpacks may use when looking up assets.

### Platform container setup

When performing a build. The platform should apply asset layer changesets to the build container. As a result there will be a filesystem subtree rooted at `/cnb/assets/` E.g.

```
cnb
 └── assets
     ├── <java11-asset-sha256>.tgz
     ├── <java13-asset-sha256>.tar
     └── <java15-asset-sha256>.zip
```

Buildpacks should then be able to quickly check for available assets using a `sha256` of the asset they wish to use in tandem with the `CNB_ASSETS` environment variable.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Increases complexity for users/buildpack authors. This adds another artifact to manage and new code paths for checking for vendored assets.


# Unresolved Questions
[unresolved-questions]: #unresolved-questions
- `io.buildpacks.asset.layers` json keys and `asset.toml` keys are not identically named.
- Creation time of asset images: `1980-01-01T00:00:01Z` does this date have another names
- Attaching asset packages to buildpackages api.





