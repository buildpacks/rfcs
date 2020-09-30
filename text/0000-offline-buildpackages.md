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
We define the asset package. Which is a reproducible OCI image. Each layer in this image contains one or more `asset` files a buildpack may contribute during a future build. Each of these `asset` files will be made available at `/cnb/assets/<asset-sha256>` in the build container.

Asset Package Layers Layout:
```
<layer1> ┳━ /cnb/assets/<java11-asset-sha256>
         ┗━ /cnb/assets/<java13-asset-sha256>

...
<layern> ━━ /cnb/assets/<java15-asset-sha256>
```

##### Asset Image Labels
Asset packages will have two labels. A simple `io.buildpacks.asset.metadata` label that contains ID and versioning information. 
``` json
{
  "id": "asset-org/asset-name",
  "version": "1.2.3"
}

```

Asset packages will also have a `io.buildpacks.asset.layers` Label. This label's contents will be a `json` object mapping each layer to metadata describing the assets it provides. This metadata is for auditing purposes.

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

The contents of this label will be a `json` object that contains a list of data describing an asset package. This will allow the platform to make decisions about pulling in asset packages before a build.

The format of this object will be as follows:
 
A top level `assets` field listing possible asset packages. Each entry in the `assets` field will list the `name`, the asset image `sha256`, an alternative `id`, as well as `layers` field whos contents will be identical to the `io.buildpacks.asset.layers`  label on the associated asset package.

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
      "layerDiffIDs": [
        "<layer1-diffID>",
        "<layer2-diffID>"
      ]
    },
    {
      "uri": "https://buildpacks.io/asset-package-fallback/java.tgz",
      "digest": "sha256:<some-asset-package-fallback-sha256>",
      "id": "buildpack-assets/asset-package-fallback",
      "version": "1.2.3",
      "layerDiffIDs": [
        "<other-layer1-diffID>"
      ]
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
          "layerDiffIDs": [
            "<layer1-diffID>",
            "<layer2-diffID>"
          ]
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

It requires a `asset.toml` file. This file contains ID and versioning info as well as has two methods to specify assets to be included in an asset package.
1) an entry in the `[[asset-cache]]` array
2) including all assets from another asset package via an entry in the `[[include]]` array.

Each entry in the `[[asset-cache]]` array may have the following fields defined:
  - `uri` (string), (required) local path or URL
  - `digest` (string), (required) Must be unique. Must be of the form `<hash-algorithm>:<hash-value>` Used for validation and as an endpoint where an  asset will be provided.
  - `metadata` (arbitrary mapping)

Each entry in the `[[include]]` array must have one of the following fields defined
  - `image` (string), image name of an asset, domain name resolution is left to the platform.
  - `uri` (string), uri to an asset image archive.


#### Example
``` toml
[asset]
  id = "my-assets/java-asset"
  version = "1.2.3"

[[asset-cache]]
uri = "https://path/to/java11.tgz"
digest = "sha256:some-sha256"

[[asset-cache]]
uri = "/local/path/to/java13.tgz"
digest = "sha256:another-sha256"
  [metadata]
    name = "java13"

[[asset-cache]]
uri = "/local/path/to/java15.tgz"
digest = "sha256:another-nother-sha256"

[[include]]
image = "gcr.io/ruby/asset-package:0.0.1"

[[include]]
uri = "https://nodejs/asset-package.tar"

```

Asset package creation should:
  - Transform all assets to an image layer filesystem changeset where the asset is provided at `/cnb/assets/<artifact-sha256>`.
  - Order all assets layers diffID.
  - Add the `io.buildpacks.asset.layers` and `io.buildpacks.asset.metadata` label metadata to the asset image.
  - set the created time in image config to a constant value.
  - set the modification time of all non-asset files to a constant value

## Using Asset Packages

Asset packages can be added to a build by three mechanisms
1) specify an asset package(s) using the `--asset` flag(s).
2) buildpackages on a builder may have asset package references in the `io.buildpacks.buildpack.layers` label. If these assets are not in the builder the platform may pull to make them available for a build.
3) Assets package layers can be added to a builder image during its creation. These assets will then be available to all builds that use this builder.


When asset packages are added to a build/builder we need to verify the following:
  - If two assets provide the same `/cnb/assets/<asset-sha256>` these two files must have identical contents. Decisions about rewriting these layers to optimize space are left to the platform.

When creating a builder with asset packages:
  - Asset package layers should be the final k layers in the builder. These should be ordered by `diff-ID`.
  - If any asset layer is a superset of another, only the superset layer is included in the builder.
  - builders hvae a `io.buildpacks.buildpack.assets` Label containing entries for every asset layer included in the builder.

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
     ├── <java11-asset-sha256>
     ├── <java13-asset-sha256>
     └── <java15-asset-sha256>
```

Buildpacks should then be able to quickly check for available assets using a `sha256` of the asset they wish to use in tandem with the `CNB_ASSETS` environment variable.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Increases complexity for users/buildpack authors. This adds another artifact to manage and new code paths for checking for vendored assets.


# Unresolved Questions
[unresolved-questions]: #unresolved-questions
- Rewriting layer operations. 
    - Hitting a hard layer limit.
    - Dependency duplication.

#### Hard Layer limit:
Given a meta-buildpackage with the following structure:
```
A
├── B
└── C
```

We will have associated Asset-Packages with the same structure
```
a
├── b
└── c
```
If buildpackage `B` is used in a build, then the platform needs to be able to determine if all assets require in `b` are on the builder. To do so we just compare 

Say we are preforming a `pack build test-image --asset huge-asset`, and we go over the layer limit. Now we have to combine & re-write some number of layers to stay under this limit. Suddenly the `io.buildpacks.asset.layers` metadata is wrong about the `diffID` values of all combined layers.

Possible solution:

We extend the `io.buildpacks.asset.layers` label to also include a `child-of` field, which points to a newly written layer that will contain this asset.

```
{
  "<layer1-diffID>": [
    {
      "digest": "sha256:java11-asset-sha256",
      "uri": "https://path/to/java11.tgz",
      "metadata": {}
      "child-of": <parentLayer-diffID>
    }
  ]
}
```
