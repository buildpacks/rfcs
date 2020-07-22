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

This RFC proposes a method to attach dependencies to buildpackages and make these dependencies available during buildpack execution.

# Motivation
[motivation]: #motivation
Why should we do this?
    1) Registry space optimizations.
    2) 1 to 1 correspondence between id+version and buildpack bits for buildpack authors.

# What it is
[what-it-is]: #what-it-is

### Define the target persona:
Buildpack user, Platform operator, Buildpack Author

### Explaining the feature largely in terms of examples.

Let's take a quick look at how offline builds currently work.

Say we are building an app that requires `ruby`. To perform an offline build a buildpack needs to:
1) include a local copy of the `ruby` dependency.
2) implement logic to copy the local `ruby` dependency into to a [`<layer>`](https://github.com/buildpacks/spec/blob/main/buildpack.md#layer-types).

An offline buildpack would have a directory structure similar to this:

```
ruby_buildpack
    ├── bin
    │   ├── build
    │   └── detect
    ├── buildpack_dependencies (only present in offline buildpack)
    │   ├── ruby-v2.7.1
    │   └── ruby-v2.6.8
    └── buildpack.toml
```

The above structure has some undesirable consequences:

- offline and online buildpacks have different contents and therefore must have different buildpack `id` fields.

We propose an extension to buildpackages that allows buildpack dependencies to be moved out of the buildpack archive and into a layer in the buildpackage. As well as, a lifecycle mechanism for letting buildpacks access these dependencies.

# How it Works
[how-it-works]: #how-it-works

Lets walk through the following steps:
1) How to create an offline buildpackage.
2) Changes to the buildpackage format.
3) How buildpacks access offline dependencies during execution.


## How to Create an offline buildpackage
This is currently done via the `pack package-buildpack` command, which consumes a [`package.toml`](https://buildpacks.io/docs/reference/package-config/) file. We propose adding an `offline_dependencies` array. We require that the `id` + `version` combination will be unique among all `offline_dependencies` entries.

#### package.toml
``` toml
[buildpack]
uri = "./path/to/buildpack.tgz"

[[offline_dependencies]]
uri = "https//uri/to/1.2.3_artifact.tgz"
id = "paketo.ruby"
version = "1.2.3"
  [offline_dependencies.metadata]
  cool = "beans"
 
[[offline_dependencies]]
uri = "https//uri/to/4.5.6_artifact.tgz"
id = "paketo.ruby"
version = "4.5.6"

[[offline_dependencies]]
uri = "https//uri/to/bundler_artifact.tgz"
id = "paketo.bundler"
version = "1.17.1"
```

If we ran `pack package-buildpack` with the above `package.toml` we would expect a `.cnb` artifact with the following structure.
 
 #### OCI format
```
├── blobs
│   └── sha256
│       ├── <image_manifest_json_sha256>
│       ├── <ruby_buildpack_diff_sha256>
│       ├── <paketo.ruby_1.2.3_diff_sha256>
│       ├── <paketo.ruby_4.5.6_diff_sha256>
│       ├── <paketo.bundler_1.17.1_diff_sha256>
│       ├── <image_config_json_sha256>
│       └── out
├── index.json
└── oci-layout
```

We will refer the the `<paketo.ruby_*..>` entries in the above OCI image as dependency layers.

When this all of the layers of the above image are applied we should have the following directory structure:

#### Applied Format
```
cnb
├─ buildpacks
│   └── ruby_buildpack
│        └── v0.0.1
│             ├── buildpack.toml
│             └── bin/...
└─ deps
    ├── paketo.ruby
    │    ├── 1.2.3
    │    ├── 1.2.3.toml
    │    ├── 4.5.6
    │    └── 4.5.6.toml
    └── paketo.bundler
         ├── 1.17.1
         └── 1.17.1.toml

```

The file at `/cnb/deps/paketo.ruby/1.2.3` will contain the artifact downloaded from `https//uri/to/1.2.3_artifact.tgz`.

The corresponding `.toml` file at `/cnb/deps/paketo.ruby/1.2.3.toml` contains all the in the `[offline_dependencies.metadata]` map. In this case `cool = "beans"`


#### id + version vs hash as a key
The choice of an `id + version` combination as the key to an offline dependency instead of a `sha256` or other hashing value is intentional. The `id + version` combination allows dependencies that require absolute paths to be usable.

Consider the `sdcv` dictionary tool. It expects the dictionary data it reads to be at a hardcoded absolute path, and is only configurable when building `sdcv` from source. This makes it impossible to have the dictionary data at `/cnb/deps/<sha256 of sdcv>` as we can't possibly know the final artifacts hash when building it.

#### Metabuildpackages

The `package.toml` example above creates an offline `ruby_buildpackage`, it does not contain any [`dependencies`](https://buildpacks.io/docs/reference/config/package-config/#dependencies-_list-optional_) entries for other buildpacks, let's refer to such a buildpackage as implementation buildpackage. Whereas buildpackages that do contain a `dependencies` entry will be referred to as metabuildpackages

If we want to create an offline metabuildpackage, all we need to do is ensure that of its implementation buildpackages are offline.

## Changes to the buildpackage format.

Offline dependencies are no longer inside of each buildpack, so we need a new way to tie a buildpack to its offline dependencies.

We can do this by adding some additional information to the buildpackage label. This way when all buildpack layers are added to a builder, we can use the same process to apply the offline dependency layers.

We propose adding the `depDiffIDs` mapping as follows.
### Label.json
``` json
{
   "paketo-buildpacks/node-engine":{
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
         ]
      }
   }
}
```

buildpacks entries may share `sha256:<...>` values in the `depDiffIDs` array.

#### Layer ordering
To enable reproducable runs of `pack create-buildpackage`, the layers in a an offline buildpackage should be ordered by the following rules.
1) all buildpack layers come before all offline dependency layers
2) offline dependency layers are ordered lexicographically by increasing diffID (believe this is how buildpacks are ordered).

With this additional information, the lifecycle should be able to add all offline dependency layers to a build by just applying them to the builder if they exist on the local registry.

#### Layer distribution

The distribution of offline dependencies into layers is left up to the platform. Though this should be a deterministic process to allow for reproducible builds.


## How buildpacks access offline dependencies during execution.

The lifecycle will allow buildpacks access to offline dependencies by
1) Buildpack dependency files will be made available on the filesystem at `/cnb/deps/<id>/<version>`
2) Buildpacks will be able to access dependencies during the `build` phase via the `CNB_DEPS` environment variable. `CNB_DEPS` will contain the value `/cnb/deps`.

#### Online vs offline execution
If the [`ruby_buildpackage`](#Applied-Format) would like to install `ruby v1.2.3` during the `build` phase, it checks to see if a file exists at `CNB_DEPS/paketo.ruby/1.2.3`. If it does, use this local dependency for the subsequent installation steps. If it does not, no offline dependency is present, the buildpack should perform an online installation.

All buildpacks can easily check if a dependency is offline by checking if a file at `/CNB_DEPS/<id>/<version>` exists. Buildpack authors will need to provide the value of `<id>` to a buildpack in order to check for offline dependencies during execution.

In general a buildpack should only install offline dependencies that it is packaged with. However, this behavior is not enforced.

#### `id + verison` collisions
If two dependency layers attempt to change the same directory `cnb/deps/<id>/<version>`, then our build should fail and exit.

#### More involved Example

Say we are invoking a `pack build` using the `meta_ruby_buildpackage`, a metabuildpack that contains the following offline buildpackages:
- `ruby_buildpackage`
- `builder_buildpackage`

##### `package.toml` used to create the `ruby_buildpackage`
``` toml
[buildpack]
uri = "./path/to/ruby_buildpack_v0_0_1.tgz"

[[offline_dependencies]]
uri = "https//ruby_1.2.3_artifact.tgz"
id = "my_buildpack_org.ruby"
version = "1.2.3"

[[offline_dependencies]]
uri = "https//ruby_4.5.6_artifact.tgz"
id = "my_buildpack_org.ruby"
version = "4.5.6"

```

##### `package.toml` used to create the `bundler_buildpackage`
``` toml
[buildpack]
uri = "./path/to/bundler_buildpack_v0_0_2.tgz"

[[offline_dependencies]]
uri = "https//bundler_1.17.0_artifact.tgz"
id = "my_buildpack_org.bundler"
version = "1.2.3"

[[offline_dependencies]]
uri = "https//bundler_2.1.0_artifact.tgz"
id = "my_buildpack_org.bundler"
version = "2.1.0"
```

After creating the above two buildpackages we can create the `meta_ruby_buildpackage`

##### `package.toml` used to create the `meta_ruby_buildpackage`
``` toml
[buildpack]
uri = "./path/to/bundler_buildpack_v0_0_2.tgz"

[[dependencies]]
  image = "registry/org/ruby_buildpackage:0.0.1"
 
 
[[dependencies]]
  image = "registry/org/bundler_buildpackage:0.0.2"
```

##### Label.json in the resulting `meta_ruby_buildpackage`

``` json
{
   "my_buildpack_org/ruby_buildpack":{
      "0.0.1":{
         "api":"0.2",
         "stacks":[
            {
               "id":"io.buildpacks.stacks.bionic"
            }
         ],
         "layerDiffID":"sha256:<ruby_buildpackage_diff_id>",
         "depDiffIDs":[
            "sha256:<ruby_1.2.3_diff_id>",
            "sha256:<ruby_4.5.6_diff_id>"
         ]
      }
   },
   "my_buildpack_org/bundler_buildpack":{
      "0.0.2":{
         "api":"0.2",
         "stacks":[
            {
               "id":"io.buildpacks.stacks.bionic"
            }
         ],
         "layerDiffID":"sha256:<bundler_buildpackage_diff_id>",
         "depDiffIDs":[
            "sha256:<bundler_1.17.0_diff_id>",
            "sha256:<bundler_2.0.1_diff_id>"
         ]
      }
   },
   "paketo-community/ruby":{
      "0.0.13":{
         "api":"0.2",
         "order":[
            "ording omitted for brevity"
         ],
         "layerDiffID":"sha256:<bundler_buildpackage_diff_id>"
      }
   }
}
```
So during buildpack execution both the `ruby_buildpack` and `bundler_buildpack` will have access to the following directory structure rooted at `/cnb/deps`. During the `build` phase they can install `bundler` and/or `ruby` by copying contents into a [`<layer>`](https://github.com/buildpacks/spec/blob/main/buildpack.md#layer-types).

```

cnb
├─ buildpacks
│   ├── ruby_buildpack
│   │    └── v0.0.1
│   │         ├── buildpack.toml
│   │         └── bin/...
│   ├── meta_ruby_buildpack
│   │    └── v0.0.3
│   │         └── buildpack.toml
│   └── bundler_buildpack
│        └── v0.0.2
│             ├── buildpack.toml
│             └── bin/...
└─ deps
    ├── paketo.ruby
    │    ├── 1.2.3
    │    ├── 1.2.3.toml
    │    ├── 4.5.6
    │    └── 4.5.6.toml
    └── paketo.bundler
         ├── 1.17.1
         └── 1.17.1.toml
```

It is then up to the buildpack to use these offline dependencies appropriately. 

## How are Benefits Realized?

#### Registry Space Optimizations

With offline dependencies pulled out of the buildpack archives, they now exist on the registry, and will automatically be de-duplicated between different versions of a buildpack.

#### 1 to 1 correspondence between id+version and buildpack bits for buildpack authors.

This simplifies the buildpack distribution process for buildpack authors. Currently online and offline buildpacks need different `buildpack.id` values in [`buildpack.toml`](https://github.com/buildpacks/spec/blob/main/buildpack.md#buildpacktoml-toml). This change would let online and offline buildpacks share the same buildpack archive bits and push the differentiation of online vs offline buildpacks into the buildpackage.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- We do not have an effective way to filter offline dependencies in `/cnb/deps`, so buildpacks could access dependencies provided by other buildpacks.


# Alternatives
[alternatives]: #alternatives

#### Always require offline_dependencies (would need a name change)

This would let us correctly build the `depDiffIDs` field in `Label.json`. This would allow online buildpacks to use offline dependencies if they happened to be sitting on the registry.



#### Alternative Label.json format
The `depDiffIDs` could be pulled out to the top level. This would let us assert that all entries in `depDiffIds` need to be unique.

``` json
"paketo-buildpacks/node-engine":{
      "0.0.178":{
         "api":"0.2",
         "stacks":[
            {
               "id":"io.buildpacks.stacks.bionic"
            }
         ],
         "layerDiffID":"sha256:<some-sha256>"
      }
"depDiffIDs": ["sha256:<some-dep-sha256>"]
}
```

# Unresolved Questions
[unresolved-questions]: #unresolved-questions



- What parts of the design do you expect to be resolved before this gets merged?
    - `package.toml` and `Labels.json` contents.
- What parts of the design do you expect to be resolved through implementation of the feature?
    - The distribution of offline dependencies into layers.
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
- new buldpackage label fields see above

