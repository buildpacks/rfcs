# Meta
[meta]: #meta
- Name: Asset Cache
- Start Date: 2020-04-27
- Author(s): dwillist
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: NA

# Summary
[summary]: #summary

This change allows buildpacks to access cached assets during builds to enable offline builds and asset reuse.

To do so we introduce the asset cache, a distribution artifact that provides vendored assets for buildpacks, and platform mechanisms to provide vendored assets to buildpacks during `build` and `detect`.

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

##### Asset Cache Definition
We define the asset cache artifact. It is a reproducible OCI image. Each layer in this image contains one or more `asset` files a buildpack may contribute during a future build. Each of these `asset` files will be made available at `/cnb/assets/<asset-digest>` in the build container.

Asset Cache Layers Layout:
```
<layer1> ┳━ /cnb/assets/<java11-asset-digest>
         ┗━ /cnb/assets/<java13-asset-digest>

...
<layern> ━━ /cnb/assets/<java15-asset-digest>
```

##### Asset Image Labels
Asset caches will have two labels. A simple `io.buildpacks.asset.metadata` label that contains the asset's name.
``` json
{
  "name": "asset-org/asset-name",
}

```

Asset caches will also have a `io.buildpacks.asset.layers` Label. This label's contents will be a `json` object mapping each layer to metadata describing the assets it provides. Note that only the `digest` field is required in the metadata mapping.

``` json
{
  "<layer1-diffID>": [
    {
      "name": "java11"
      "digest": "sha256:java11-asset-sha256",
      "uri": "https://path/to/java11.tgz",
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
    }
  ]
}
```

##### Buildpackage Changes

To enable buildpackages to reference asset caches, we define a new buildpackage label, `io.buildpacks.buildpackage.assets`.

The contents of this label will be a `json` with a list of data describing each asset cache. This will allow the platform to make decisions about which assets to pull before a build.

The format of this object will be as follows:
 
A top level `assetCache` field listing possible asset caches. Each entry in the `assetCache` field will list the `name`, the asset image `refDigest`, an alternative `id`, as well as `layersDiffIDs` field with contents identical to the `io.buildpacks.asset.layers`  label on the associated asset cache.

##### Buildpackage Label
[buildpackage-label]: #buildpackage-label
``` json
{
  "assetCache": [
    {
      "ref": "gcr.io/buildpacks/java-asset-cache",
      "refDigest": "sha256:<some-java-asset-cache-sha256>",
      "name": "buildpacks-assets/java-assets@1.1.1",
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
              "extra": "java13 metadata"
            }
          }
        ],
        "<layer2-diffID>": [
          "..."
        ]
      }
    },
    {
      "ref": "https://buildpacks.io/asset-cache-fallback/java.tgz",
      "refDigest": "sha256:<some-asset-cache-fallback-sha256>",
      "name": "buildpack-assets/asset-cache-fallback@1.2.3",
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

Builders that contain asset caches will have an `io.buildpacks.asset.layers` with the same format as the asset cache label. Again this label will contain a `<layer1-diffID>` entry for each asset layer contained in the builder.

Builders will additionally need to retain the asset references for each buildpackage in the builder. For this we will extend the existing `io.buildpacks.buildpack.layers` label to contain mappings to contain an `cachedAssets` field identical to the one above.

``` json
{
  "buildpack/id": {
    "0.0.0": {
      "stacks": [],
      "layerDiffID": "sha256:some-diff-id",
      "homepage": "https://homepage-url",
      "cachedAssets": [
        {
          "ref": "gcr.io/buildpacks/java-asset-cache",
          "refDigest": "sha256:<some-java-asset-cache-sha256>",
          "name": "buildpacks-assets/java-assets@1.1.1",
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
                  "extra": "java13 metadata"
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

## Asset cache creation

Asset Image creation will be handled by the platform. E.g. `pack package-asset <asset-cache-name> --config <asset.toml>`

It requires a `asset.toml` file. This file contains three top level objects: Naming info and two methods to specify assets to be included in an asset cache.
1) Name information under a top level `[asset-cache]` mapping
2) An `[[assets]]` array, each entry specifies an individual asset to be included in the asset image
3) An `[[include]]` array specifying other asset caches. All assets from asset caches in this array will be included in the resultant asset cache.

The `[asset-cache]` mapping may have the following fields defined:
- `name` (string)

Each entry in the `[[assets]]` array may have the following fields defined:
  - `uri` (string), (required) local path or URL
  - `digest` (string), (required) Must be unique. Must be of the form `<algorithm>:<hash-value>`. this is used for validation and as an endpoint where an  asset will be provided.
  - `metadata`(optional) (arbitrary mapping)
  - `name` (string),(optional) a human readable name of the dependency

Each entry in the `[[include]]` array must have one of the following fields defined
  - `image` (string), image name of an asset, image name resolution is left to the platform.
  - `uri` (string), uri to an asset image archive.


#### Example
``` toml
[asset-cache]
  name = "my-assets/java-asset@1.2.3"

[[assets]]
name = "java11"
uri = "https://path/to/java11.tgz"
digest = "sha256:some-sha256"

[[assets]]
uri = "/local/path/to/java13.tgz"
digest = "sha256:another-sha256"
  [metadata]
    extra = "java13 metadata"

[[assets]]
uri = "/local/path/to/java15.tgz"
digest = "sha256:another-nother-sha256"

[[include]]
image = "gcr.io/ruby/asset-cache:0.0.1"

[[include]]
uri = "https://nodejs/asset-cache.tar"

```

Asset cache creation should:
  - Transform all assets to an image layer filesystem changeset where the asset is provided at `/cnb/assets/<artifact-digest>`.
  - Order all assets layers diffID.
  - Add the `io.buildpacks.asset.layers` and `io.buildpacks.asset.metadata` label metadata to the asset image.
  - set the created time in image config to a constant value.
  - set the modification time of all non-asset files to a constant value.

## Using Asset Caches

Asset caches can be added to a build by three mechanisms
1) specify an asset cache(s) using the `--asset` flag(s).
2) buildpackages on a builder may have asset cache references in the `io.buildpacks.buildpack.layers` label that are not included in the builder. The platform may pull to make them available for a build.
3) Assets package layers can be added to a builder image during its creation. These assets will then be available to all builds that use this builder.


When asset caches are added to a build/builder we need to verify the following:
  - If two assets provide the same `/cnb/assets/<asset-digest>` these two files must have identical contents. Decisions about rewriting these layers to optimize space are left to the platform.

When creating a builder with asset caches:
  - Asset cache layers should be the final k layers in the builder. These should be ordered by `diff-ID`.
  - If any asset layer is a superset of another, only the superset layer is included in the builder.
  - builders have a `io.buildpacks.buildpack.assets` Label containing entries for every asset layer included in the builder.

### Adding Asset Cache references to a buildpackage

A new `[[asset-cache]]` array is added to the `package.toml` file used to create buildpackages. The values in this array are used to fill out the `io.buildpacks.buildpackage.assets` label.

The following entries in a `package.toml` file would produce the Buildpackage labels in the above example.
```toml
[[asset-cache]]
image = "gcr.io/buildpacks/java-asset-cache"

[[asset-cache]]
uri = "https://buildpacks.io/asset-cache-fallback/java.tgz"

[[asset-cache]]
image = "urn:cnb:registry:buildpacks/java-asset-cache"
```

The platform may verify each `[[asset-cache]]` exists when creating a buildpackage.

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

# Alternatives
[alternatives]: #alternatives

We change the primary mapping for all labels from `layerDiffId` -> `assetDigest` to `assetDigest -> layerDiffId`.

This would change the following labels:

### Asset Cache changes
`io.buildpacks.asset.layers` (would be renamed to `io.buildpacks.asset.digests`)

``` json
{
  "sha256:java11-asset-sha256": {
    "name": "java11",
    "layerDiffId": "<layer1-diffID>",
    "uri": "https://path/to/java11.tgz",
    "metadata": {}
  },
  "sha256:<java13-asset-sha256>": {
    "layerDiffId": "<layer1-diffID>",
    "metadata": {
      "name": "java13"
    }
  },
  "sha256:<java15-asset-sha256>": {
    "layerDiffId": "<layern-diffID>",
    "metadata": {}
  }
}
```

### Buildpackage Changes

the contents of the `io.buildpacks.buildpackage.assets` would look like:

Here each `asset` in the `assetCache` array has a `digest` -> `layerDiffId` mapping, instead of a `layerDiffId` -> `digest` mapping

``` json
{
  "assetCache": [
    {
      "ref": "gcr.io/buildpacks/java-asset-cache",
      "digest": "sha256:<some-java-asset-cache-sha256>",
      "name": "buildpacks-assets/java-assets@1.1.1",
      "assetDigests": {
        "sha256:java11-asset-sha256": {
          "layerDiffId": "<layer1-diffID>",
          "uri": "https://path/to/java11.tgz",
          "metadata": {}
        },
        "sha256:<java13-asset-sha256>": {
          "layerDiffId": "<layer2-diffID>",
          "metadata": {
            "extra": "java13 metadata"
          }
        }
      }
    },
    {
      "ref": "https://buildpacks.io/asset-cache-fallback/java.tgz",
      "digest": "sha256:<some-asset-cache-fallback-sha256>",
      "name": "buildpack-assets/asset-cache-fallback@1.2.3",
      "assetDigests": {
        "sha256:<java15-asset-sha256>": {
          "layerDiffId": "other-layer-diffId",
          "uri": "/local/path/to/java15.zip",
          "metadata": {}
        }
      }
    }
  ]
}
```

### Builder Changes

Basically incorporating the same structure above into builder metadata.

``` json
{
  "buildpack/id": {
    "0.0.0": {
      "stacks": [],
      "layerDiffID": "sha256:some-diff-id",
      "homepage": "https://homepage-url",
      "assetCache": [
        {
          "ref": "gcr.io/buildpacks/java-asset-cache",
          "digest": "sha256:<some-java-asset-cache-sha256>",
          "name": "buildpacks-assets/java-assets@1.1.1",
          "assetDigests": {
            "sha256:java11-asset-sha256": {
              "layerDiffId": "<layer1-diffID>",
              "uri": "https://path/to/java11.tgz",
              "metadata": {}
            },
            "sha256:<java13-asset-sha256>": {
              "layerDiffId": "<layer2-diffID>",
              "metadata": {
                "extra": "java13 metadata"
              }
            }
          }
        },
        {
          "ref": "https://buildpacks.io/asset-cache-fallback/java.tgz",
          "digest": "sha256:<some-asset-cache-fallback-sha256>",
          "name": "buildpack-assets/asset-cache-fallback@1.2.3",
          "assetDigests": {
            "sha256:<java15-asset-sha256>": {
              "layerDiffId": "other-layer-diffId",
              "uri": "/local/path/to/java15.zip",
              "metadata": {}
            }
          }
        }
      ]
    },
    "0.0.1": {}
  }
}
```

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

