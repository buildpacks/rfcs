# Meta
[meta]: #meta
- Name: Offline Buildpackages
- Start Date: 2020-04-27
- Author(s): Dan Thornton
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)

# Summary
[summary]: #summary

One paragraph explanation of the feature.

We need to have a method to attach dependencies to buildpackages to support offline workflows. These dependencies should then be made available via the filesystem during the `build` phase.

# Motivation
[motivation]: #motivation

- Why should we do this?
    - Remove need for two separate `ids` for online vs offline buildpacks
    - Performance optimizations

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define any new terminology.
    - Here we add the concept of an offline buildpackage. This is just a buildpackage with additional dependencies added in layers.

- Define the target persona:
    - Buildpack user, Platform operator, Buildpack Author
- Explaining the feature largely in terms of examples.

If we want to support offline builds, with the current lifecycle & buildpackage spec we are forced to throw all dependencies inside of a buildpack archive. So an offline `ruby` buildpack would have a structure similar to the following:

```
cnb
├─ buildpacks
│   └─ ruby-buildpack
│       └─ 1.2.3
│           ├── bin
│           │   ├── build
│           │   └── detect
│           ├── dependencies
│           │   ├── ruby-v2.7.1
│           │   └── ruby-v2.6.8
│           └── buildpack.toml
└── lifecycle
```
There are problems with the above:

- Buildpacks packaged with dependencies & packaged without dependencies have different `sha256` values and therefore must have different buildpack `id` fields to avoid registry collision issues.

We propose a `lifecycle` mechanism for exposing buildpack dependencies, and an extension to buildpackages that moves these dependencies out of buildpack archives.

1) Buildpack dependencies should be made available during the `build` phase in a file tree rooted at `/cnb/deps`
2) Buildpacks should be able to access dependencies they were packaged with via the `CNB_DEPS` environment variable.
3) The [`package.toml`](https://buildpacks.io/docs/reference/package-config/) file should have additional metadata for each dependencies to specify
    - the endpoint a dependency is exposed at via the lifecycle 

# How it Works
[how-it-works]: #how-it-works

Answering the following should outline the behavior of this feature.

### How will dependencies appear on the filesystem during the `build` phase?

Dependencies will be listed underneath `/cnb/deps/` with a schema that has the following properties:

- dependency placement does not depend on the dependencies bits (no hashes, SHA256, ...).
- dependency placement is calculable by the lifecycle (needed to provide through `CNB_DEPS`).
- dependency placement is specific enough to reduce inter-buildpack collisions.
- dependency placement provides compartmentalization between buildpacks, (`CNB_DEPS` only provides paths to dependencies a buildpack should have access to).

```
cnb
├─ buildpacks
│   └─ ruby-buildpack
│       └─ 1.2.3
│           ├── bin
│           │   ├── build
│           │   └── detect
│           └── buildpack.toml
├─ deps
│   ├── io.paketo.mri
│   │    ├── v2.7.1.toml
│   │    ├── v2.7.1
│   │    ├── v2.6.8.toml
│   │    └── v2.6.8
│   ├── io.paketo.other-dep
│   │    ├── v2.2.2.toml
│   │    └── v2.2.2
│   └── <id>
│        ├── v1.2.3.toml
│        ├── v1.2.3
│        ├── <version>
│        └── <version>.toml
└── lifecycle
```
### How will paths to dependencies be exposed to a buildpack?

During the `build` phase of the `paketo-buildpacks/mri` buildpack, the `CNB_DEPS` environment variable will provide a path pointing to a `packaged.toml` file, this will contain information on all all dependencies packaged with a buildpack.

More on the contents of this file [here](#What-are-the-contents-of-the-packagedtoml-file-that-CNB_PATH-points-to).


### How are dependencies added to a buildpackage, what is the `pack` user experience?
These dependencies are added to a buildpackage by specifying fields in the `package.toml`

``` toml
[buildpack]
uri = "./path/to/buildpack.tgz"

[[dependencies]]
uri = "path/to/dependency"
id = "org.some-identifier"
version = "v1.2.3"
  [dependencies.metadata]
  # dependency-specific data

[[dependencies]]
uri = "https://buildpacks.cloudfoundry.org/dependencies/node/node_10.20.0_linux_x64_cflinuxfs3_76f4a198.tgz"
ID = "paketo.node"
version = "v10.20.0"
  [dependencies.metadata]
  cool = "beans"


```

the above would give us the following file tree.

```
cnb
└─ deps
    ├── org.some-identifier
    │    ├── v1.2.3.toml
    │    └── v1.2.3
    └── paketo.node
         ├── v10.20.0.toml
         └── v10.20.0

```


### How are dependencies grouped as layers
Layers containing dependencies are attached as the final layers to a buildpackage. The exact distribution of dependencies into layers is left up to the packaging utility.


### How are dependency layers matched with a buildpack?
A buildpack packaged with dependencies will have the added `depLayers` field in the `org.buildpack.buildpack.layers` metadata.

``` json 
"paketo-buildpacks/node-engine":{
      "0.0.178":{
         "api":"0.2",
         "stacks":[
            {
               "id":"org.cloudfoundry.stacks.cflinuxfs3"
            },
            {
               "id":"io.buildpacks.stacks.bionic"
            }
         ],
         "layerDiffID":"sha256:9ae53c280ea60b30b8c03978fbd2f761769fe0c15e421a9ece68e2f52926ce77",
         "depLayers":{
              "sha256:sha256-to-dep-layer": {
                 "path": "/cnb/deps/path/to/dep1",
                 "id": "org.some-identifier",
                 "version": "v1.2.3", "metadata": {}
              },
              "sha256:sha256-to-other-dep-layer": {
                 "path": "/cnb/deps/path/to/dep1",
                 "id": "paketo.node",
                 "version": "v10.20.0",
                 "metadata": {"cool": "beans"}
              }
         }
    
      }
```
Each entry in the `depLayers` object maps a layer SHA to it's path. As well as preserves the `id`, `version` and `metadata` fields from `package.toml`

### How do we determine if a dependency layer should be added to a build?
The file tree rooted at the `/cnb/deps/` is only available at `build` time. So we add all layers to a build that match the following criteria:
  - If a buildpack passes detection all of its `depLayers` should be added to a build.

### What are the contents of the `packaged.toml` file that `CNB_PATH` points to?

This file looks very similar to the `json` label and can be parsed by a buildpack to look up available offline dependencies

``` toml
[[dependencies]]
path = "/cnb/deps/some-identifier/v1.2.3"
id = "some-identifier"
version = "v1.2.3"
  [dependencies.metadata]
  # dependency-specific data

[[dependencies]]
path = "/cnb/deps/paketo.node/v1.2.3"
id = "paketo.node"
ID = "paketo.node"
  [dependencies.metadata]
  cool = "beans"
```

This file gives us a single place to read all offline dependency information during a build.


### Other benefits?
Build times could be further optimized, with dependencies attached as layers, there is the option to symlink a file at `cnb/dependencies/org.dep-id/stack.v1.2.3` directly to a buildpack provided layer.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What is the strategy for staying under the 127 Layer limit.
- Is `CNB_DEPS` a bad buildpack author experience?
- should we force some dependency api at each `/cnb/deps/some-identifier/v1.2.3`?


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.



