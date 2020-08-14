# Meta 4
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

To do so we introduce the Asset Image, a distribution artifact that provides vendored assets for buildpacks, and platform mechanisms to provide vendored assets to buildpacks during the `build` and `detect`.

# Motivation
[motivation]: #motivation

- Simplify artifacts needed to achieve offline builds.
- Enable registry de-deplication of buildpack assets

# What it is
[what-it-is]: #what-it-is

### Define the target persona:
Buildpack user, Platform operator, Buildpack author

### Explaining the feature largely in terms of examples.

Lets walk through an example `pack build` using Asset Images, and the platform changes proposed below.

We pull an Asset Image, using`docker pull asset-image` (or some equivalent command). The asset image has a `json` label mapping the `sha256` values of all the assets it includes to. a `layer` in the Asset Image.

We run `pack build --buildpack new-buildpack`

A `new-buildpack` has label metadata containing the `sha256` of assets it could download during a build. However, `new-buildpack` does not contain any of these assets.

Before buildpack execution the platform reads the `sha256` values from the label metadata on `new-buildpack`. It then searches through local images to check for:
  1) Exposed `asset` sha256 values.
  2) A match between the expose, and the `sha256` value from `new-buildpack`.

If both conditions are met, the platform applies the `layerID` mapped to this `sha256` to the build environment, exposing a vendored asset at `/cnb/assets/<asset-sha256>` to all buildpacks.



# How it Works
[how-it-works]: #how-it-works

### Asset Image Definition.

An Asset Image is a collection of layers each of which provide one or more assets. These layers are in lexicographic order by `diffID`.

```
<layer1> ━━ /cnb/deps/<java11-asset-sha256>/java11
<layer2> ━━ /cnb/deps/<java13-asset-sha256>/java13

...
<layern> ━━ /cnb/deps/<java15-asset-sha256>/java15
```

Each Asset Image will have a `io.buildpacks.buildpack.assets` Label. This label's contents will be a `json` object mapping each `asset` sha256 to a `JSON` object that contains a `layerDiffID`, and other optional keys.

#### Example

``` json
{

  "<java11-asset-sha256>" : {
     "layerDiffID": "<layer1-diffID>",
     "additional_paths": ["other/endpoint1", "other/endpoint2"],
     "metadata": {}
  },
  "<java13-asset-sha256>" : {
    "layerDiffID": "<layer2-diffID>",

    "additional_paths": [],
    "metadata": {
      "name": "java13"
    }
  },
  "<java15-asset-sha256>" : {
    "layerDiffID": "<layerk-diffID>",
    "additional_paths": []
  }
}

```

#### Schema
TODO: once above format is validated.



### Creating Asset Images.

Asset Image creating will be performed by a new pack command, `pack packages-assets`. `package-assets` and will use an `assets.toml` configuration file. Each entry in `asset.toml` will provide the following:
  - `uri` string (required)
  - `sha256` (required) used for validation
  - `additional_paths` array
  - `metadata` arbitrary mapping

The `additional_paths`array lists additional endpoints where the platform should provide the asset to buildpack during a buildpack run. This is provided for cases where `assets` require absolute paths.


Ever assets must be in one of the following archive formats:
  - `tar.gz`
  - ...


So the `asset.toml` to produce the asset image [above](#Example) would be:

#### Example
``` toml
[[asset]]
url = "https://path/to/java11.tgz"
sha256 = "some-sha256"
additional_paths = ["other/endpoint1", "other/endpoint2"]

[[asset]]
url = "/local/path/to/java13.tgz"
sha256 = "another-sha256"
  [metadata]
    name = "java13"
 
[[asset]]
...

[[asset]]
url = "/local/path/to/java15.tgz"
sha256 = "another-nother-sha256"
```

The `pack create-asset` command will
  - download all assets, and validate a sha256 of the artifact.
  - unarchive the archive, transform it to a [image layer filesystem changeset](https://github.com/opencontainers/image-spec/blob/master/layer.md)
  - order all assets layers [diffID](`https://github.com/opencontainers/image-spec/blob/e562b04403929d582d449ae5386ff79dd7961a11/config.md#layer-diffid`)
  - add all `additional_paths` symlinks to the resultant image, in the case of path collisions fail.
  - add `io.buildpacks.buildpack.assets` label metadata to image.

### Buildpackage changes

In order for buildpackages to be able to reference the `assets` and pull them into a build, we need to add `assetHash` metadata to the `io.buildpacks.buildpack.layers` `buildpackage` label.

``` json
{
   "buildpack-org/java-buildpack":{
      "0.0.178":{
         "api":"0.2",
         "stacks":[
            {
               "id":"io.buildpacks.stacks.bionic"
            }
         ],
         "layerDiffID":"sha256:<some-sha256>",
         "depDiffIDs":[
            "sha256:<some-dep-sha256>"
         ],
         "assetHash": [
            "<java12-asset-sha256>",
            "<java13-asset-sha256>",
            "<java15-asset-sha256>"
         ]
      }
   }
}
```

In order for us to have access to this data our `pack package-buildpack` command should require both a `package.toml` and `assets.toml` configuration file.

### New `build` behavior


##### Lifecycle changes

The platform should now pass an additional `CNB_ASSETS` environment variable, with the default value of `/cnb/assets`, to the `build` binary.

##### Platform behavior changes

To enable buildpacks to access vendored assets, a platform may:
  - Read buildpackage `assetHash` metadata.
  - For every `sha256` in this hash we search all locally available images for the `io.buildpacks.buildpack.assets` label, if the label exists check if it contains the `sha256`.
      - if so add this layer to the builder, this will add an asset at `/cnb/assets`, then and create symlinks for all `additional_paths`.
  - Error cases:
      - two different layers modify the same `/cnb/assets/<sha256>`
      - two different layers attempt to create the same `additional_path` symlink

During a buildpacks `build` phase, vendored assets will be accessible at below `/cnb/assets` and buildpacks may use them as needed.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Performance concerns around finding `assets` in local images. This search likely does not scale well (lots of file IO)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should `asset.toml` and `package.toml` be collapsed into a single file? This would break lots of existing
- Should builders have access to local assets? What type of config should users pass to enable or disable this behavior?

