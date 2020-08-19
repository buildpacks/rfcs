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

To do so we introduce the Asset Package, a distribution artifact that provides vendored assets for buildpacks, and platform mechanisms to provide vendored assets to buildpacks during the `build` and `detect`.

# Motivation
[motivation]: #motivation

- Simplify artifacts needed to achieve offline builds.
- Enable registry de-deplication of buildpack assets

# What it is
[what-it-is]: #what-it-is

### Define the target persona:
Buildpack user, Platform operator, Buildpack author

### Explaining the feature largely in terms of examples.

Lets walk through an example `pack build` using Asset Package, and the platform changes proposed below.

This is as simple as specifying any Asset Packages to be used in a build.

`pack build --buildpack some-buildpack -asset asset-package`

The `asset-package` will provide a set of asset files all rooted at `/cnb/assets/` to which buildpacks may use.

As with the `--buildpack` flag, multiple `--asset` flags may be passed. These flags may reference an image, local archive filepath, or URL.

# How it Works
[how-it-works]: #how-it-works

### Asset Package Definition.

An Asset Package is a collection of layers each of which provide one or more assets. These layers are in lexicographic order by `diffID`. The distribution of assets into layers is an implementation detail left to the platform.

```
<layer1> ┳━ /cnb/deps/<java11-asset-sha256>/java11
         ┃                                  ┗ (archive contents)
         ┗━ /cnb/deps/<java13-asset-sha256>/java13.tgz

...
<layern> ━━ /cnb/deps/<java15-asset-sha256>/java15.tgz
```

Asset Packages will have a `io.buildpacks.buildpack.assets` Label. This label's contents will be a `json` object mapping each layer to metadata describing the assets it provides.
#### Example

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
      "uri": "/local/path/to/java13.tgz",
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
      "uri": "/local/path/to/java15.tgz",
      "additionalPaths": [],
      "metadata": {}
    }
  ]
}
```

### Creating Asset Packages.

Asset Image creation will be handled by a new pack command, `pack package-assets --config <packag.toml> <asset-image-name>`.

The `package-assets` command will use a `package.toml` configuration file and produce an `<asset-image-name>` OCI image artifact. `<asset-image-name>` may be a tarball, or a locally available image.

To specify assets included in an Asset Package the `package.toml` file must contain an `assets` array. Each entry in this array may provide:
  - `uri` (string), (required) local path or URL
  - `sha256` (string), (required) Must be unique. Used for validation and as an endpoint where an  asset will be provided.
  - `additional-paths` (array)
  - `metadata` (arbitrary mapping)
  - `unzip` (bool), unzip asset when building

The `additional-paths` array lists endpoints where the platform should provide symlinks to the asset. This is provided for cases where `assets` require absolute paths.

The `unzip` field is used to indicate that an asset should be unarchived then added to the Asset Package. In order to use this flag an asset is  must be in one of the following archive formats:
  - `tar.gz`
  - (TBD)


The `asset` array that would produce the asset image [above](#Example) would be:

#### Example
``` toml
[[asset]]
url = "https://path/to/java11.tgz"
sha256 = "some-sha256"
additional-paths = ["other/endpoint1", "other/endpoint2"]
unzip = true

[[asset]]
url = "/local/path/to/java13.tgz"
sha256 = "another-sha256"
  [metadata]
    name = "java13"
 
[[asset]]
#...

[[asset]]
url = "/local/path/to/java15.tgz"
sha256 = "another-nother-sha256"
```

The `pack create-asset` command will
  - download asset if needed, then validate a sha256 of the artifact
  - if unzip is true, unzip the asset
  - transform asset to a [image layer filesystem changeset](https://github.com/opencontainers/image-spec/blob/master/layer.md) where the asset is provided at `/cnb/assets/<artifact-sha256>`
  - add all `additional-paths` symlinks to the resultant image, in the case of path collisions fail
  - order all assets layers [diffID](`https://github.com/opencontainers/image-spec/blob/e562b04403929d582d449ae5386ff79dd7961a11/config.md#layer-diffid`)
  - add `io.buildpacks.buildpack.assets` label metadata to image

## Using Asset Packages

##### Asset packages as arguments

Asset Images may be passed as arguments to the platform may be in any of the following formats:
- OCI image archives
- locally available images
- remote images

Decisions between local or remote images are left to the platform.

##### `lifecycle` changes
The platform should now pass an additional `CNB_ASSETS` environment variable to the `build` phase binary. `CNB_ASSETS` will by default be `/cnb/assets`. This provides a standard variable buildpacks may use when searching for assets.

### `create-builder` behavior

The `pack create-builder` command will accept Asset Packages passed with `asset` flags. In the final builder image all layers from Asset Packages will be the final `k` layers in the image. These `k` layers will be ordered by `diffID`.

The `create-builder` command will perform the following steps on the specified Asset Packages:
  - Validate any two assets do not provide the same `assets` in both 'zipped' and 'unzipped' form.
  - Validate any two assets do not have a common element in `additionalPaths` that is linked to different `/cnb/assets/<asset-sha256>` locations.
  - If any asset layer is a superset of another, only the superset layer is included in the builder.
  - builders inherit a `io.buildpacks.buildpack.assets` Label containing entries for every asset layer included in the builder.

### `build` behavior

To enable buildpacks to access vendored assets during a `pack build`, a platform should:
  - accept `assets` flags
  - perform the same asset validation that occurs in `create-builder`
  - add asset layers from both the builder and flags to the build environment image

This allows buildpacks to access vendored assets below `/cnb/assets` during the `build` phase.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Increases complexity for users. This adds another artifact to manage.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Other formats to support when 'unzipping'
- How should we resolve `zipped` vs `unzipped` assets, providing both a better strategy?
- is `diffID` a good key to order layers by?
- should we be able to add asset packages to buildpackages?

