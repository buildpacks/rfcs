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

To do so we introduce the asset cache, a distribution artifact that provides vendored assets for buildpacks, and platform mechanisms to provide vendored assets to buildpacks during `build` and `detect`. We also add a top level `[[assets]]` array in `buildpack.toml`

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

### Asset Cache Definition
We define the asset cache artifact. It is a reproducible OCI image. Each layer in this image contains one or more `asset` files a buildpack may contribute during a future build. Each of these `asset` files will be made available at `/cnb/assets/<asset-digest>` in the build container.

##### General Layer Structure:
```
<layer1> ┳━ /cnb/assets/<java11-asset-digest>
         ┗━ /cnb/assets/<java13-asset-digest>

...
<layern> ━━ /cnb/assets/<java15-asset-digest>
```

### Asset Cache Image Labels
Asset caches will have two labels. A simple `io.buildpacks.asset.metadata` label that contains the asset's name.
``` json
{
  "name": "asset-org/asset-name"
}
```

Asset caches will also have a `io.buildpacks.asset.layers` Label. This label maps individual `assets` to the containing layer using `layerDiffID`

##### General Format:
```json
{
  "asset-sha256": {
    "name": "(optional)",
    "layerDiffID": "(required)",
    "uri": "(optional)",
    "stacks": [
      "(optional)",
      "..."
    ],
    "metadata": {
      "(optional)": "(optional)"
    }
  }
}
```

##### Example:

``` json
{
  "<java11-asset-sha256>": {
    "name": "java11",
    "layerDiffId": "<layer1-diffID>",
    "uri": "https://path/to/java11.tgz",
    "stacks": ["io.buildpacks.stacks.bionic"],
    "metadata": {}
  },
  "<java13-asset-sha256>": {
    "layerDiffId": "<layer1-diffID>",
    "stacks": ["io.buildpacks.stacks.bionic"],
    "metadata": {
      "name": "java13"
    }
  },
  "<java15-asset-sha256>": {
    "stacks": ["io.buildpacks.stacks.bionic"],
    "layerDiffId": "<layerk-diffID>",
  }
}
```

### Buildpack.toml changes

In order to maintain a link between buildpacks and the assets they may provide we add a top level `[[assets]]` array to the `buildpack.toml` file.

##### General Format

```toml
[buildpack]
  id = "paketo-buildpacks/node-engine"
  version = "0.0.1"
 
[[assets]]
  sha256 = "(required)"
  name = "(optional)"
  uri = "(optional)"
  metadata = "(optional)"
  stacks = ["(required)"]
```


### Buildpackage Changes

To keep track of the buildpack to asset mapping defined in `buildpack.toml` we add an additional json array under each buildpack entry in the `io.buildpacks.buildpack.layers`. Note that the `asset` array may contain assets not included in the buildpackage.

##### General Format:

```json
{
  "buildpack-id": {
    "0.0.1": {
      "api": "0.1",
      "stacks": [
        "..."
      ],
      "layerDiffID": "sha256:<some-diffID>",
      "homepage": "https://buildpacks.io",
      "assets": [
        {
          "sha256": "asset-1-sha256"
        },
        {
          "sha256": "asset-2-sha256"
        },
        {
          "sha256": "..."
        }
      ]
    }
  }
}
```

##### Example

```json
{
  "buildpacks/nodejs": {
    "0.0.171": {
      "api": "0.4",
      "stacks": [
        {
          "id": "io.buildpacks.stacks.bionic"
        }
      ],
      "layerDiffID": "sha256:...",
      "homepage": "https://buildpacks.io",
      "assets": [
        {
          "sha256": "node12.9.0-sha256"
        },
        {
          "sha256": "node14.5.0-sha256"
        }
      ]
    }
  }
}
```

To keep track of what assets are actually in our buildpackages, and what layer they are packaged in we add the label, `io.buildpacks.assets.layers`. Note, this label has already been defined above on `asset-cache` as well.


To tie a buildpack to relevant asset cache images, we add a final label `io.buildpacks.asset.images`, which again is `json`. This maps an OCI image digest to a list of assets the image contains, as well as possible image locations.


##### General Format:
```json
{
  "asset-cache-sha256": {
    "name": "name from 'io.buildpacks.asset.metadata'",
    "locations": [
      "index.docker.io/asset-cache-name",
      "..."
    ],
    "assets": [
      {
        "sha256": "asset-1-sha256"
      },
      {
        "sha256": "asset-2-sha256"
      },
      "..."
    ]
  }
}
```

These three label let us determine
- set of all assets that could be used by a buildpackage
- the set of assets that are currently included in a buildpackage
- set of assets that may be used by an individual buildpack.
- set of assets provided by some predefined images.
- possible locations to fetch assets from


To keep our metadata consistent we also propose adding the `assets` array to the `io.buildpacks.buildpackage.metadata` label.

##### General Format
```json
{
  "id": "buildpack-id",
  "version": "0.0.1",
  "homepage": "https:/buildpacks.io",
  "stacks": [
    {
      "id": "io.buildpacks.stacks.bionic"
    }
  ],
  "assets": [
    {
      "sha256": "asset-1-sha256"
    },
    {
      "sha256": "asset-2-sha256"
    },
    "..."
  ]
}
```


### Builder Changes

Builders will also require the changes outline above to the following tags:
- `io.buildpacks.asset.layers`
- `io.buildpacks.buildpack.layers`
- `io.buildpacks.asset.images`

Additionally we will add an `asset` array to `io.buildpacks.builder.metadata` to keep it consistent with the updates to  `io.buildpacks.builpack.layers`.

##### General Format
```json
{
  "buildpacks": [
    {
      "id": "buildpack-id",
      "version": "0.0.1",
      "homepage": "https://buildpacks.io",
      "assets": [
        {
          "sha256": "asset-1-sha256"
        },
        {
          "sha256": "asset-2-sha256"
        },
        "..."
      ]
    }
  ]
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

##### General Format:
```toml
[asset-cache]
    name = "(required)"
 
[[assets]]
  sha256 = "(required)"
  name = "(optional)"
  uri = "(optional)"
  [assets.metadata]
    optional_key = "(optional value)"  

[[include]]
  uri = "(optional)"
  image = "(optional)" #exactly one of 'uri' or 'image' must be present
```


##### Example
``` toml
[asset-cache]
  name = "my-assets/java-asset@1.2.3"

[[assets]]
name = "java11"
uri = "https://path/to/java11.tgz"
sha256 = "some-sha256"

[[assets]]
uri = "/local/path/to/java13.tgz"
sha256 = "another-sha256"
  [assets.metadata]
    extra = "java13 metadata"

[[assets]]
uri = "/local/path/to/java15.tgz"
sha256 = "another-nother-sha256"

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

#### UX in practice
Likely the creation of asset packages will follow two different routes for implementation buildpacks and metabuildpackages. This dichotomy follows the existing differences between packaging metabuildpackages, and implementation buildpackages.

##### implementation buildpacks

running `pack package-asset <implementation-buildpack.toml>` should produce an asset cache, as a `buildpack.toml` file contains all needed `assets`

##### metabuildpacks

running `pack package-asset <metabuildpack-package.toml>` will use a `package.toml` file as this command needs to reference other `asset-cache` images in the `include` array by specifying a `uri` or `image`.

## Metabuildpackage Creation

When creating a metabuildpack, we want to retain all of the asset information from the child buildpacks.

As such `assets` array in `io.buildpacks.buildpack.layers` `io.buildpacks.buildpack.metadata` of the resulting metabuildpack will be a sum of all of the `asset` arrays in its children.

In a similar vein, the `io.buildpacks.asset.images` will contain entries from all of the metabuildpacks children.

If there are conflicts when merging these entries, the platform may decide to continue or fail.  

## Using Asset Caches

Asset caches can be added to a build by three mechanisms
1) specify an asset cache(s) using the `--asset` flag(s).
2) buildpackages on a builder may have asset cache references in the `io.buildpacks.assets.images` label that are not included in the builder. The platform may pull to make them available for a build.
3) Assets cache layers can be added to a builder image during its creation. These assets will then be available to all builds that use this builder.


When asset caches are added to a build/builder we need to verify the following:
  - If two assets provide the same `/cnb/assets/<asset-digest>` these two files must have identical contents. Decisions about rewriting these layers to optimize space are left to the platform.

When creating a builder with asset caches:
  - Asset cache layers should be the final k layers in the builder. These should be ordered by `diff-ID`.
  - If any asset layer is a superset of another, only the superset layer is included in the builder.
  - builders have a `io.buildpacks.buildpack.assets` Label containing entries for every asset included in the builder.

### Adding Asset Cache references to a buildpackage

A new `[[asset-cache]]` array is added to the `package.toml` file used to create buildpackages. The values in this array are used to fill out the `io.buildpacks.buildpackage.assets` label.

The following entries in a `package.toml` file would produce the Buildpackage labels in the above example.
```toml
[buildpack]
  uri = "buildpack-uri.tgz"

[[dependencies]]
  image = "buildpack/dependency:0.0.1"

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

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

