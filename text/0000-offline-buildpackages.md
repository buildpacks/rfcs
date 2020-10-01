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

##### Asset Package Definition
We define the asset package. Which is a reproducible OCI image. Each layer in this image contains one or more `asset` files a buildpack may contribute during a future build. Each of these `asset` files will be made available at `/cnb/assets/<asset-digest>` in the build container.

Asset Package Layers Layout:
```
<layer1> ┳━ /cnb/assets/<java11-asset-digest>
         ┗━ /cnb/assets/<java13-asset-digest>

...
<layern> ━━ /cnb/assets/<java15-asset-digest>
```

##### Asset Image Labels
Asset packages will have two labels. A simple `io.buildpacks.asset.metadata` label that contains ID and versioning information.
``` json
{
  "id": "asset-org/asset-name",
  "version": "1.2.3"
}

```

Asset packages will also have a `io.buildpacks.asset.layers` Label. This label's contents will be a `json` object mapping each layer to metadata describing the assets it provides.

``` json
{
  "<layer1-diffID>": [
    {
      "digest": "sha256:java11-asset-sha256",
      "uri": "https://path/to/java11.tgz",
      "metadata": {}
    },
    {
      "digest": "sha256:<java13-asset-sha256>",
      "metadata": {
        "name": "java13"
      }
    }
  ],
  "...": [],
  "<layern-diffID>": [
    {
      "digest": "sha256:<java15-asset-sha256>",
      "uri": "/local/path/to/java15.zip",
      "metadata": {}
    }
  ]
}
```

##### Buildpackage Changes

To enable buildpackages to reference asset packages, we define a new buildpackage label,`io.buildpacks.buildpackage.assets`.

The contents of this label will be a `json` with a list of data describing each asset package. This will allow the platform to make decisions about which assets to pull before a build.

The format of this object will be as follows:
 
A top level `assets` field listing possible asset packages. Each entry in the `assets` field will list the `name`, the asset image `digest`, an alternative `id`, as well as `layersDiffIDs` field with contents identical to the `io.buildpacks.asset.layers`  label on the associated asset package.

##### Buildpackage Label
[buildpackage-label]: #buildpackage-label
``` json
{
  "assets": [
    {
      "uri": "gcr.io/buildpacks/java-asset-package",
      "digest": "sha256:<some-java-asset-package-sha256>",
      "id": "buildpacks-assets/java-assets",
      "version": "1.1.1",
      "layerDiffIDs": {
        "<layer1-diffID>": [
          {
            "digest": "sha256:java11-asset-sha256",
            "uri": "https://path/to/java11.tgz",
            "metadata": {}
          },
          {
            "digest": "sha256:<java13-asset-sha256>",
            "metadata": {
              "name": "java13"
            }
          }
        ],
        "<layer2-diffID>": [
          "..."
        ]
      }
    },
    {
      "uri": "https://buildpacks.io/asset-package-fallback/java.tgz",
      "digest": "sha256:<some-asset-package-fallback-sha256>",
      "id": "buildpack-assets/asset-package-fallback",
      "version": "1.2.3",
      "layerDiffIDs": {
        "<other-layer1-diffID>": [
          {
            "digest": "sha256:<java15-asset-sha256>",
            "uri": "/local/path/to/java15.zip",
            "metadata": {}
          }
        ]
      }
    }
  ]
}
```

##### Builder Changes

Builders that contain asset packages will have an `io.buildpacks.asset.layers` with the same format as the asset package label. Again this label will contain a `<layer1-diffID>` entry for each asset layer contained in the builder.

Builders will additionally need to retain the asset references for each buildpackage in the builder. For this we will extend the existing `io.buildpacks.buildpack.layers` label to contain mappings to contain an `assets` field identical to the one above.

``` json
{
  "buildpack/id": {
    "0.0.0": {
      "stacks": [],
      "layerDiffID": "sha256:some-diff-id",
      "homepage": "https://homepage-url",
      "assets": [
        {
          "uri": "gcr.io/buildpacks/java-asset-package",
          "digest": "sha256:<some-java-asset-package-sha256>",
          "id": "buildpacks-assets/java-assets",
          "version": "1.1.1",
          "layerDiffIDs": {
            "<layer1-diffID>": [
              {
                "digest": "sha256:java11-asset-sha256",
                "uri": "https://path/to/java11.tgz",
                "metadata": {}
              },
              {
                "digest": "sha256:<java13-asset-sha256>",
                "metadata": {
                  "name": "java13"
                }
              }
            ],
            "<layer2-diffID>": [
              "..."
            ]
          }
        },
        {
          "...": "..."
        }
      ]
    }
  }
}
```




# How it Works
[how-it-works]: #how-it-works

## Asset package creation

Asset Image creation will be handled by the platform. E.g. `pack package-asset <asset-image-name> --config <asset.toml>`

It requires a `asset.toml` file. This file contains three top level objects: the ID and versioning info as well as two methods to specify assets to be included in an asset package.
1) ID and version information under a top level `[asset-package]` mapping
2) An `[[assets]]` array, each entry specifies an individual asset to be included in the asset image
3) An `[[include]]` array specifying other asset packages. All assets from asset packages in this array will be included in the resultant asset package.

The `[asset-package]` mapping must have the following fields defined:
- `id` (string)
- `version`(string)

Each entry in the `[[assets]]` array may have the following fields defined:
  - `uri` (string), (required) local path or URL
  - `digest` (string), (required) Must be unique. Must be of the form `<algorithm>:<hash-value>`. this is used for validation and as an endpoint where an  asset will be provided.
  - `metadata` (arbitrary mapping)

Each entry in the `[[include]]` array must have one of the following fields defined
  - `image` (string), image name of an asset, image name resolution is left to the platform.
  - `uri` (string), uri to an asset image archive.


#### Example
``` toml
[asset_package]
  id = "my-assets/java-asset"
  version = "1.2.3"

[[assets]]
uri = "https://path/to/java11.tgz"
digest = "sha256:some-sha256"

[[assets]]
uri = "/local/path/to/java13.tgz"
digest = "sha256:another-sha256"
  [metadata]
    name = "java13"

[[assets]]
uri = "/local/path/to/java15.tgz"
digest = "sha256:another-nother-sha256"

[[include]]
image = "gcr.io/ruby/asset-package:0.0.1"

[[include]]
uri = "https://nodejs/asset-package.tar"

```

Asset package creation should:
  - Transform all assets to an image layer filesystem changeset where the asset is provided at `/cnb/assets/<artifact-digest>`.
  - Order all assets layers diffID.
  - Add the `io.buildpacks.asset.layers` and `io.buildpacks.asset.metadata` label metadata to the asset image.
  - set the created time in image config to a constant value.
  - set the modification time of all non-asset files to a constant value.

## Using Asset Packages

Asset packages can be added to a build by three mechanisms
1) specify an asset package(s) using the `--asset` flag(s).
2) buildpackages on a builder may have asset package references in the `io.buildpacks.buildpack.layers` label that are not included in the builder. The platform may pull to make them available for a build.
3) Assets package layers can be added to a builder image during its creation. These assets will then be available to all builds that use this builder.


When asset packages are added to a build/builder we need to verify the following:
  - If two assets provide the same `/cnb/assets/<asset-digest>` these two files must have identical contents. Decisions about rewriting these layers to optimize space are left to the platform.

When creating a builder with asset packages:
  - Asset package layers should be the final k layers in the builder. These should be ordered by `diff-ID`.
  - If any asset layer is a superset of another, only the superset layer is included in the builder.
  - builders have a `io.buildpacks.buildpack.assets` Label containing entries for every asset layer included in the builder.

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
The platform should now provide a `CNB_ASSETS` environment variable to the `build` and `detect phases`. This provides a standard variable buildpacks may use when looking up assets. The value of `CNB_ASSETS` will default to `/cnb/assets`.

### Platform container setup

When performing a build. The platform should apply asset layer changesets to the build container. As a result there will be a filesystem subtree rooted at `/cnb/assets/` E.g.

```
cnb
 └── assets
     ├── <java11-asset-digest>
     ├── <java13-asset-digest>
     └── <java15-asset-digest>
```

Buildpacks should then be able to quickly check for available assets using a `digest` of the asset they wish to use in tandem with the `CNB_ASSETS` environment variable.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Increases complexity for users/buildpack authors. This adds another artifact to manage and new code paths for checking for vendored assets.


# Unresolved Questions
[unresolved-questions]: #unresolved-questions
