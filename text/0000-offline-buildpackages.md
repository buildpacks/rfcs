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
We define the asset cache artifact. It is a reproducible OCI image. Each layer in this image contains one or more `asset` files a buildpack may contribute during a future build. Each of these `asset` files will be made available at `/cnb/assets/<asset-sha256>` in the build container.

##### General Layer Structure:
```
<layer1> ┳━ /cnb/assets/<java11-asset-sha256>
         ┗━ /cnb/assets/<java13-asset-sha256>

...
<layern> ━━ /cnb/assets/<java15-asset-sha256>
```

### Asset Cache Image Labels
Asset caches will have two labels. An`io.buildpacks.asset.metadata` label that contains a human readable name.
``` json
{
  "name": "asset-org/asset-name"
}
```

Asset caches will also have a `io.buildpacks.asset.layers` Label. This label maps individual `assets` to the containing layer using `layerDiffID`

##### General Format:
```json
{
  "<asset-sha256>": {
    "name": "(optional)",
    "id": "(required)",
    "version": "(required)",
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
    "id": "java",
    "version": "11.0.9",
    "name": "java11",
    "layerDiffId": "<layer1-diffID>",
    "uri": "https://path/to/java11.tgz",
    "stacks": ["io.buildpacks.stacks.bionic"],
    "metadata": {}
  },
  "<java13-asset-sha256>": {
    "id": "java",
    "version": "13.0.2",
    "layerDiffId": "<layer1-diffID>",
    "stacks": ["io.buildpacks.stacks.bionic"],
    "metadata": {
      "license": "..."
    }
  },
  "<java15-asset-sha256>": {
    "id": "java",
    "version": "15.0.2",
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
  id   = "(required)"
  version = "(required)"
  uri = "(optional)"
  stacks = ["(required)"]
  [assets.metadata]
   optional-key = "(optional value)"

```


### Buildpackage Changes

To keep track of the buildpack to asset mapping defined in `buildpack.toml` we add an additional json array under each buildpack entry in the `io.buildpacks.buildpack.layers`.

##### General Format:

```json
{
  "buildpack-id": {
    "0.0.1": {
      "api": "0.1",
      "stacks": [
        "stack1",
        "stack2",
        "..."
      ],
      "layerDiffID": "sha256:<some-diffID>",
      "homepage": "https://buildpacks.io",
      "assets": [
        {
          "sha256": "asset-1-sha256",
          "id": "asset-1-id",
          "version": "asset-1-version",
          "uri": "asset-1-uri",
          "name": "Asset 1 Name",
          "stacks": [
            "stack1",
            "..."
          ],
          "metadata": {}
        },
        {
          "sha256": "asset-2-sha256",
          "id": "asset-2-id",
          "version": "asset-2-version",
          "stacks": [
            "stack1",
            "stack2"
          ]
        },
        {
          "sha256": "...",
          "id": "...",
          "version": "...",
          "stacks": [
            "stack1",
            "stack2"
          ]
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
          "sha256": "node12.9.0-sha256",
          "id": "node",
          "version": "12.9.0",
          "name": "Node JS",
          "uri": "https://asset-location-url",
          "stacks": [
            "io.buildpacks.stacks.bionic"
          ],
          "metadata": {
            "license": "MIT"
          }
        },
        {
          "sha256": "node14.5.0-sha256",
          "id": "node",
          "version": "14.5.0",
          "stacks": [
            "io.buildpacks.stacks.bionic"
          ]
        }
      ]
    }
  }
}
```


This label let us determine:
- set of all assets that could be used by a buildpackage
- set of assets that may be used by an individual buildpack.
- locations to fetch assets from


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
      "sha256": "asset-1-sha256",
      "id": "asset-1-id",
      "version": "1.2.3",
      "stacks": [
        "stack1",
        "..."
      ]
    },
    {
      "sha256": "asset-2-sha256",
      "id": "asset-2-id",
      "version": "2.3.4",
      "stacks": [
        "stack1",
        "..."
      ]
    },
    "..."
  ]
}
```


### Builder Changes

To keep track of what assets are actually in our builder, and what layer they are contained in we add the label, `io.buildpacks.assets.layers`. Note, this label has already been defined above on asset-cache.

Builders will also require the same changes outlined in the Buildpackage section above to the `io.buildpacks.buildpack.layers` tag.

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
          "sha256": "asset-1-sha256",
          "id": "asset-1-id",
          "version": "1.2.3",
          "stacks": [
            "stack1",
            "..."
          ]
        },
        {
          "sha256": "asset-2-sha256",
          "id": "asset-2-id",
          "version": "2.3.4",
          "stacks": [
            "stack1",
            "..."
          ]
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

Asset Image creation will be handled by the platform. E.g. `pack package-asset <asset-cache-name> --asset-config <optional-path-to-asset.toml>`.

There are two ways to package assets
1) from a `buildpack.toml` file. This method uses the `assets` array to locate download and verify assets.
    - Ex: `pack package-asset <asset-cache-name> <path-to-buildpack.toml>`
2) from an already existing buildpackage. This will download all assets using `uri`s from the `io.buildpacks.buildpack.layers` label, or re-use assets that are included in the specified buildpackage's layers.
    - Ex: `pack package-asset <asset-image-name> <path-to-package.toml>`

The `--asset-config` flag is optional but recommended to control naming of the generated asset. (May also manually pass naming info)

### `asset.toml (optional)`

To provide additional control over asset creation, we may optionally pass  the `pack package-asset` command an additional `--asset-config asset.toml` flag & file, this file defines metadata that impacts the contents of an asset.
- the `asset-cache.name` field, is used to populate the `io.buildpacks.asset.metadata` field.
- the `exclude-dependencies` array, which must have valid buildpack`id` and `version`, all assets associated with this buildpack will be excluded from the resulting asset cache.
- `exclude-assets` indicates a `sha256` of a specific asset we should exclude from the resulting asset cache.
- `asset-override` provides a way to override the `uri` used to download an asset.


#### General Format:
```toml
[asset-cache (optional)]
  name = "(required)"
 
[[exclude-dependencies (optional)]]
  id = "(required)"
  version = "(required)"

[[exclude-assets (optional)]]
  sha256 = "(required)"

[[asset-override (optional)]]
  uri = "preferred/asset/location"
  sha256 = "asset-sha256"
```

#### Example
```toml
[asset-cache]
  name = "node-asset-cache"
 
[[exclude-dependencies]]
  id = "buildpacks/node-engine"
  version = "1.2.3"

[[exclude-assets]]
  sha256 = "vulnerable-node10-sha256"
  name = "Node js version with security vulnerability. (non-functional)"

[[asset-override]]
  uri = "../local/path/to/nodejs-asset"
  sha256 = "node13-sha256"
```


Asset cache creation should:
  - filter excluded assets specified in the `asset-config` file.
  - Transform all remaining assets to an image layer filesystem changeset where the asset is provided at `/cnb/assets/<artifact-digest>`.
  - Order all assets layers diffID.
  - Add the `io.buildpacks.asset.layers` and `io.buildpacks.asset.metadata` label metadata to the asset image. If name is specified for `io.buildpacks.asset.metadata`, generate one.
  - set the created time in image config to a constant value.
  - set the modification time of all non-asset files to a constant value.

#### UX in practice
Likely the creation of asset packages will follow two different routes for implementation buildpacks and metabuildpackages. This dichotomy follows the existing differences between packaging metabuildpackages, and implementation buildpackages.

##### Implementation Buildpacks

running `pack package-asset <implementation-buildpack.toml>` should produce an asset cache, as a `buildpack.toml` file contains all needed `assets`.

##### Metabuildpacks

running `pack package-asset <metabuildpack-package.toml>` will use a `package.toml` file as this command needs to reference other `buildpackages` images in the `dependencies` array by specifying a `uri` or `image`.

## Metabuildpackage Creation

### Metadata

When creating a metabuildpack, we want to retain all of the asset information from the child buildpacks.

As such `assets` array in `io.buildpacks.buildpack.layers` `io.buildpacks.buildpack.metadata` of the resulting metabuildpack will be a sum of all of the `asset` arrays in its children.

If there are conflicts when merging these entries, the platform may decide to continue or fail.


## Builder Creation

When creating a builder we can now specify `asset-cache` packages we wish to include in the builder image. We may also pass an `--asset-config asset.toml` file to excluded particular assets that would normally be included. Additionally there should be the option to include all assets from specified buildpackages using the `--offline` flag (the resulting builders will be very large).

## Using Asset Caches

Asset caches can be added to a build by two mechanisms
1) specify an asset cache(s) using the `--asset-cache` flag(s) in a `pack build <...>`.
2) Assets cache layers can be added to a builder image during its creation. These assets will then be available to all builds that use this builder.


When asset caches are added to a build/builder we need to verify the following:
  - The asset is not excluded through a `asset.toml` file passed to `pack build`.
  - If two assets provide the same `/cnb/assets/<asset-digest>` these two files must have identical contents. Decisions about rewriting these layers to optimize space are left to the platform.

When creating a builder with asset caches:
  - Asset cache layers should be the final k layers in the builder. These should be ordered by `diff-ID`.
  - If any asset layer is a superset of another, only the superset layer is included in the builder.
  - builders have a `io.buildpacks.buildpack.assets` Label containing entries for every asset included in the builder.


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

Buildpacks should then be able to quickly check for available assets using a `sha256` of the asset they wish to use in tandem with the `CNB_ASSETS` environment variable. The `sha256` value used to perform this lookup should be pulled from the relevant `[[asset]]` entry in `buildpack.toml`

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Increases complexity for users/buildpack authors. This adds another artifact to manage and new code paths for checking for vendored assets.

# Alternatives
[alternatives]: #alternatives

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

