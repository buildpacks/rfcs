# Meta
[meta]: #meta
- Name: Export to OCI format
- Start Date: 2022-02-22
- Author(s): Juan Bustamante (@jjbustamante)
- Status: Approved
- RFC Pull Request: [rfcs#203](https://github.com/buildpacks/rfcs/pull/203)
- CNB Pull Request: (leave blank)
- CNB Issue: N/A
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Add the capability to the `Exporter` phase to save the image to disk in [OCI Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format.

# Definitions
[definitions]: #definitions

- A [Platform](https://buildpacks.io/docs/concepts/components/platform/) uses a lifecycle, Buildpacks (packaged in a builder), and application source code to produce an OCI image.
- A [Lifecycle](https://buildpacks.io/docs/concepts/components/lifecycle/) orchestrates Buildpacks execution, then assembles the resulting artifacts into a final app image.
- A **Daemon** is a service, popularized by Docker, for downloading container images, and executing and managing containers from those images.
- A **Registry** is a long-running service used for storing and retrieving container images.
- An **image reference** refers to either a tag reference or digest reference.
- A **tag reference** refers to an identifier of form `<registry>/<repo>:<tag>` which locates an image manifest in an [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/master/spec.md) compliant registry.
- A **digest reference** refers to a [content addressable](https://en.wikipedia.org/wiki/Content-addressable_storage) identifier of form `<registry>/<repo>@<digest>` which locates an image manifest in an [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/master/spec.md) compliant registry.
- A **image Manifest** provides a configuration and set of layers for a single container image for a specific architecture and operating system.
- The **layer diffID** is the hash of the uncompressed layer
- The **layer digest** is the hash of the compressed layer.
- An [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) is the directory structure for OCI content-addressable blobs and [location-addressable](https://en.wikipedia.org/wiki/Content-addressable_storage#Content-addressed_vs._location-addressed) references.

# Motivation
[motivation]: #motivation

### Why should we do this?

Lifecycle translates an application source code into an OCI image, in order to do this, it can be configured to interact with a docker daemon (using `daemon` flag) or with an OCI registry.

The [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) is the directory structure for OCI content-addressable blobs and [location-addressable](https://en.wikipedia.org/wiki/Content-addressable_storage#Content-addressed_vs._location-addressed) references.

The current process, executed by the lifecycle, does not take into consideration cases where a platform implementor may require to pass through the inputs or want to save the final application image on disk using [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format.

### What use cases does it support?

Exporting to [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) will enable new user's workflows on top of this functionality. For example:
  - It provides a mechanism to reduce the Lifecycle complexity by removing the interaction with the Daemon in the future.
  - Solve the problem of losing information when the image is saved into the Daemon, keeping the image on disk along with the metadata generated by the Lifecycle. The OCI Image can be used as input for other tools to offer more capabilities to the end users.
  - This feature will help to unblock uses cases like
    - OCI annotations. See [RFC](https://github.com/buildpacks/rfcs/pull/196)
    - Cosign integration. See [RFC](https://github.com/buildpacks/rfcs/pull/195)
    - Export to tarball. See [issue](https://github.com/buildpacks/lifecycle/issues/423)

### What is the expected outcome?

Lifecycle will be capable of exporting the application image into disk in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format. The image saved on disk could have the following considerations:

- The `blobs` directory MAY be missing `base image` or `run image` blobs. These layers may not be needed on disk as they could be already accessible in a blob store.
- The `blobs` directory SHOULD always have buildpacks generated `blobs`.


# What it is
[what-it-is]: #what-it-is

The proposal is to add a new capability to the lifecycle (enabled by configuration) to resolve any **image reference** (input or output) to a disk location in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format. It means, instead of interacting with a daemon or registry lifecycle will interact against the filesystem to read or write any **image reference**.

The target personas affected by this change are:

- **Platform implementors**: they will have to take care of the responsibility of creating a store resource on disk in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format and pass it through the lifecycle during the phases execution.  

The process of writing any image on disk in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format could be expensive in terms of hard drive space or IO operation (compressing or uncompressing layers). In order to provide flexibility for the implementation, the `analyzer` or `exporter` binaries only require the *Image Manifest* and the *Image Config* to execute their operations on the previous image and run image; based on this, we proposed the Lifecycle can be configured to work with a partial representation of the images on disk, meaning that some blobs MAY be missing (which is ok according to the [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format). The missing blobs SHOULD be those that are already available in a daemon or registry.  

Let's see some examples of the proposed behavior

## Examples

### Requirements

Lifecycle will converts image references into local paths following define [rules](#how-to-map-an-image-reference-into-a-path-in-the-layout-repository) and the content must be in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format.

Let's suppose a *platform implementor* creates a directory with the following structure:

```=shell
layout-repo
└── index.docker.io
    ├── cnb
    │   ├── my-full-stack-run:bionic
    │   │   └── bionic
    │   │       └── blobs
    │   │           ├── sha256
    │   │           │   ├── 1f59...944a // manifest
    │   │           │   ├── 6388...af5a // config
    │   │           │   ├── 824b...f984e
    │   │           │   ├── f5f7...5b38
    │   │           │   └── 870e...f1b09
    │   │           ├── index.json
    │   │           └── oci-layout
    │   └── my-partial-stack-run:bionic
    │       └── bionic
    │           ├── blobs
    │           │   └── sha256
    │           │       ├── 1f59...944a // manifest
    │           │       └── 6388...af5a // config
    │           ├── index.json
    │           └── oci-layout
    └── bar
        └── my-previous-app
            └── latest
                ├── blobs
                │   └── sha256
                │       ├── 4bcd5..x               // app image manifest
                │       ├── 5f789..d               // app image config
                │       ├── 624b...f984e           // run layer
                │       └── 4g234..f               // buildpack layer
                ├── index.json
                └── oci-layout
```

The images named **cnb/my-full-stack-run** and **cnb/my-partial-stack-run** represents the same image but the partial one has missing `blobs`, those `blobs` are the layers that are already available in the store from it came from.

For each example case, I will present two ways of enabling the new capability:

- Using an environment variables
- Using the new `-layout` and `layout-dir` flags

In any case the expected output is the same.

#### Analyze phase

##### Analyzing run-image full saved on disk

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/analyzer -run-image cnb/my-full-stack-run:bionic my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -layout-dir /layout-repo -run-image cnb/my-full-stack-run:bionic my-app-image
```

expected analyzed.toml output

```=toml
[run-image]
  reference = "/layout-repo/index.docker.io/cnb/my-full-stack-run/bionic@sha256:fab3bb83de466ed29d7e9dcfdbee5b5fb2ff90e91bc849af85b261b4c2062a7a"

```

##### Analyzing run-image partial saved on disk

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/analyzer -run-image cnb/cnb/my-partial-stack-run:bionic my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -layout-dir /layout-repo -run-image cnb/cnb/my-partial-stack-run:bionic my-app-image
```

expected analyzed.toml output

```=toml
[run-image]
  reference = "/layout-repo/index.docker.io/cnb/my-partial-stack-run@sha256:fab3bb83de466ed29d7e9dcfdbee5b5fb2ff90e91bc849af85b261b4c2062a7a"

```

##### Analyzing previous-image

 ```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/analyzer -run-image cnb/my-full-stack-run:bionic -previous-image bar/my-previous-app my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -layout-dir /layout-repo -run-image cnb/my-full-stack-run:bionic-previous-image bar/my-previous-app my-app-image
```

expected analyzed.toml output

```=toml
[run-image]
  reference = "/layout-repo/index.docker.io/cnb/my-partial-stack-run/bionic@sha256:fab3bb83de466ed29d7e9dcfdbee5b5fb2ff90e91bc849af85b261b4c2062a7a"

[previous-image]
  reference = "/layout-repo/index.docker.io/bar/my-previous-app/latest@sha256:aa0cf7fc8f161bdb96166c1644174affacd70d17f372373ca72c8e91116e2d43"

```

##### Analyzing run-image not saved on disk

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/analyzer -run-image cnb/bad-run-image my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -layout-dir /layout-repo -run-image cnb/bad-run-image my-app-image

# expected output

ERROR: the run-image could not be found at path: /layout-repo/index.docker.io/cnb/bad-run-image/latest
```

##### Analyzing without run-image argument

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/analyzer my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -layout-dir /layout-repo my-app-image

# expected output

ERROR: -run-image is required when OCI Layout feature is enabled
```

##### Analyzing without layout-dir argument

```=shell
> export CNB_USE_LAYOUT=true
> /cnb/lifecycle/analyzer -run-image cnb/bad-run-image my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -run-image cnb/bad-run-image my-app-image

# expected output

ERROR: defining a layout directory is required when OCI Layout feature is enabled. Use -layout-dir flag or CNB_LAYOUT_DIR environment variable
```

Let's also check some examples when the export phase is executed

#### Export phase

##### Export to OCI using run-image full saved on disk

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/exporter my-app-image

# OR

>  /cnb/lifecycle/exporter -layout -layout-dir /layout-repo my-app-image
```

The output will be written into the repository folder described above and it should looks like this:

```=shell
layout-repo
└── index.docker.io
    ├── cnb
    │   └── my-full-stack-run:bionic
    │       └── bionic
    │           └── blobs
    │               ├── sha256
    │               │   ├── 1f59...944a // manifest
    │               │   ├── 6388...af5a // config
    │               │   ├── 824b...f984e
    │               │   ├── f5f7...5b38
    │               │   └── 870e...f1b09
    │               ├── index.json
    │               └── oci-layout
    └── library
        └── my-app-image
            └── latest
                ├── blobs
                │   └── sha256
                │       ├── 1bcd5..x               // app image manifest
                │       ├── 2f789..d               // app image config
                │       ├── 824b...f984e           // run layer
                │       ├── f5f7...5b38            // run layer
                │       ├── 870e...f1b09           // run layer
                │       └── 3g234..f               // buildpack layer
                ├── index.json
                └── oci-layout

```

As we can see, the application image `my-app-image` contains a **full** copy of the layers in its `blobs` folder.


##### Export to OCI using run-image partially saved on disk

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/exporter my-app-image

# OR

>  /cnb/lifecycle/exporter -layout -layout-dir /layout-repo my-app-image
```

Expected output:

```=shell
layout-repo
└── index.docker.io
    ├── cnb
    │   └── my-partial-stack-run:bionic
    │       └── bionic
    │           ├── blobs
    │           │   └── sha256
    │           │       ├── 1f59...944a // manifest
    │           │       └── 6388...af5a // config
    │           ├── index.json
    │           └── oci-layout
    └── library
        └── my-app-image
            └── latest
                ├── blobs
                │   └── sha256
                │       ├── 1bcd5..x               // app image manifest
                │       ├── 2f789..d               // app image config
                │       └── 3g234..f               // buildpack layer
                ├── index.json
                └── oci-layout

```

As we can see, the application image `my-app-image` has missing `blobs` because they were not provided as input and the lifecycle just **skip writing** those layers on disk.

##### Using -layout flag in combination with --daemon or --publish flags

Any combination of using multiple sources or sinks in the Lifecycle invocation of phases should throw an error to the user. For example:

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/exporter -daemon -run-image cnb/my-full-stack-run:bionic my-app-image

# OR

> /cnb/lifecycle/exporter -layout -layout-dir /layout-repo -daemon -run-image cnb/my-full-stack-run:bionic my-app-image

ERROR: exporting to multiple targets is unsupported
```

# How it Works
[how-it-works]: #how-it-works

The lifecycle phases affected by this new behavior are:
 - [Analyze](https://buildpacks.io/docs/concepts/components/lifecycle/analyze/)
 - [Restore](https://buildpacks.io/docs/concepts/components/lifecycle/restore/)
 - [Export](https://buildpacks.io/docs/concepts/components/lifecycle/export/)  
 - [Create](https://buildpacks.io/docs/concepts/components/lifecycle/create/)

At a high level view the proposed solution can be summarized with the following system landscape diagram from the C4 model

![](https://i.imgur.com/y972lTD.png)

Notice that we are relying on the OCI format Specification to expose the data for `Platforms`

The following new inputs are proposed to be added to these phases

 | Input | Environment Variable  | Default Value | Description
 |-------|-----------------------|---------------|--------------
 | `<layout>` | `CNB_USE_LAYOUT` | false | Enables the capability of resolving image from/to in OCI layout format on disk |
 | `<layout-dir>` | `CNB_LAYOUT_DIR` |  | Path to a directory where the images are saved in OCI layout format|

## How to map an image reference into a path in the layout repository

In the previous examples one key element was how to translate an image reference into a path, let's define those rules.

Considering an **image reference** refers to either a tag reference or digest reference. It could have the following formats
- A name reference refers to an identifier of form `<registry>/<repo>/<image>:<tag>`
- A digest reference refers to a content addressable identifier of form `<registry>/<repo>/<image>@<algorithm>:<digest>`

The image look up will be done following these rules:
  - WHEN `the image points to a name reference`
    - Lifecycle will load/save the image from/to disk in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format at `<layout-dir>/<registry>/<repo>/<image>/<tag>`
  - WHEN `the image points to a digest reference`
    - Lifecycle will load the image from disk in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format at `<layout-dir>/<registry>/<repo>/<image>/<algorithm>/<digest>`
  - WHEN `<registry>` is not provided default value will be **index.docker.io**
    - IF `<repo>` is not also provided, then default value will be **library**


## Examples

In all the examples the new feature is enabled by the use of the new flag `-layout` or by setting
the new environment variable `CNB_USE_LAYOUT` to true.

Let's review some previous examples

#### Analyze phase

##### Analyzing run-image full saved on disk

Command:

```=shell
> export CNB_USE_LAYOUT=true
> export CNB_LAYOUT_DIR=/layout-repo
> /cnb/lifecycle/analyzer -run-image cnb/my-full-stack-run:bionic my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -layout-dir /layout-repo -run-image cnb/my-full-stack-run:bionic my-app-image
```

Arguments received:

 - `run-image`: `cnb/my-full-stack-run:bionic`
 - `image`: `my-app-image`

The `<layout-dir>` is set with the value `/layout-repo`

Lifecycle applies the rules for looking up the images:
 - It takes the **tag reference** `cnb/my-full-stack-run:bionic`, applies the conversion rules and gets `/index.docker.io/cnb/my-full-stack-run/bionic` 
 - It will append the `<layout-dir>` at the beginning, getting the following path: `/layout-repo/index.docker.io/cnb/my-full-stack-run/bionic`  
 - It will look for an image saved on disk in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format at path `/layout-repo/index.docker.io/cnb/my-full-stack-run/bionic`.
 - In case of the *application image* it will look at path `/layout-repo/index.docker.io/library/my-app-image/latest`

Because both images are found, the phase is executed as usual and the `analyzed.toml` file will be updated. The `run-image.reference` added into the `analyzed.toml` will contain the path resolved by the lifecycle plus the digest reference to the image with the following format `[path]@[digest]`. In case of this example, it will look like this:

```=toml
[run-image]
  reference = "/layout-repo/index.docker.io/cnb/my-partial-stack-run/bionic@sha256:fab3bb83de466ed29d7e9dcfdbee5b5fb2ff90e91bc849af85b261b4c2062a7a"
```  

##### Analyzing run-image partial saved on disk

Command received:

```=shell
> export CNB_USE_LAYOUT=true
> /cnb/lifecycle/analyzer -run-image cnb/cnb/my-partial-stack-run:bionic my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -run-image cnb/cnb/my-partial-stack-run:bionic my-app-image
```

Arguments received:

 - `run-image`: `cnb/my-full-partial-run:bionic`
 - `image`: `my-app-image`

The `<layout-dir>` is set with the default value `/layout-repo`

Noticed the structure of the `run-image` provided

```=shell
layout-repo
└── index.docker.io
    └── cnb
        └── my-partial-stack-run:bionic
            └── bionic
                ├── blobs
                │   └── sha256
                │       ├── 1f59...944a // manifest
                │       └── 6388...af5a // config
                ├── index.json
                └── oci-layout
```

Similar to the previous example, Lifecycle applies the rules for looking up the images and look at path `/layout-repo/index.docker.io/cnb/my-partial-stack-run/bionic` and it determines a partial image was provided and execute the phase with the information from the **Image Manifest** and the **Image Config**

The output `analyzed.toml` will also include the new `run-image.reference` field the path and the digest of the run image. 

```=toml
[run-image]
  reference = "/layout-repo/index.docker.io/cnb/my-partial-stack-run/bionic@sha256:fab3bb83de466ed29d7e9dcfdbee5b5fb2ff90e91bc849af85b261b4c2062a7a"
```  

##### Analyzing previous-image

Command received:

```=shell
> export CNB_USE_LAYOUT=true
> /cnb/lifecycle/analyzer -run-image cnb/my-full-stack-run:bionic -previous-image bar/my-previous-app my-app-image

# OR

> /cnb/lifecycle/analyzer -layout -run-image cnb/my-full-stack-run:bionic -previous-image bar/my-previous-app my-app-image
```

Arguments received:

- `run-image`: `cnb/my-full-stack-run:bionic`
- `previous-image`: `bar/my-previous-app`
- `image`: `my-app-image`

The `<layout-dir>` is set with the default value `/layout-repo`

`run-image` and `image` arguments are treated in the same way as previous examples, and for `previous-image` argument the looking up images rules are applied and Lifecycle will look at path `/index.docker.io/bar/my-previous-app` for a image in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format.

The `analyzed.toml` file es expected to be updated with the `previous-image.reference` containing the path and the digest of the `previous-image`

```=toml
[run-image]
  reference = "/layout-repo/index.docker.io/cnb/my-full-stack-run/bionic@sha256:fab3bb83de466ed29d7e9dcfdbee5b5fb2ff90e91bc849af85b261b4c2062a7a"

[previous-image]
  reference = "/layout-repo/index.docker.io/bar/my-previous-app/latest@sha256:aa0cf7fc8f161bdb96166c1644174affacd70d17f372373ca72c8e91116e2d43"

```

Let's check how the `export` examples works on detailed

##### Export to OCI using run-image full saved on disk

Pre-conditions:

The following directories are accessible by the lifecycle
```=shell
/
├── layout-repo
│   └── index.docker.io
│       └── cnb
│           └── my-full-stack-run:bionic
│               └── bionic
│                   └── blobs
│                       ├── sha256
│                       │   ├── 1f59...944a // manifest
│                       │   ├── 6388...af5a // config
│                       │   ├── 824b...f984e
│                       │   ├── f5f7...5b38
│                       │   └── 870e...f1b09
│                       ├── index.json
│                       └── oci-layout
└── layers
    └── analyzed.tom
```

The `/layers/analyzed.toml` file contains the following data:

```=toml
[run-image]
  reference = "/layout-repo/index.docker.io/cnb/my-full-stack-run/bionic@sha256:fab3bb83de466ed29d7e9dcfdbee5b5fb2ff90e91bc849af85b261b4c2062a7a"

```

Command executed:

```=shell
> export CNB_USE_LAYOUT=true
> /cnb/lifecycle/exporter  my-app-image

# OR

>  /cnb/lifecycle/exporter -layout  my-app-image
```

Arguments received:

- `image`: `my-app-image`

The `<layout-dir>` is set with the default value `/layout-repo`

Lifecycle:
 - It will read the `[run-image]` section in the `analyzed.toml`, it will parse `reference` attribute using the `@` separator and load the `run-image` image saved on disk in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format at path `/layout-repo/index.docker.io/cnb/my-full-stack-run/bionic`.
 - Lifecycle could also validate the digest of the image loaded is the same as the one established by the `reference`.
 - Lifecycle will execute the export steps and at the end of the process it will write the *application image* at path `/layout-repo/index.docker.io/library/my-app-image/latest` in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format


The output image will be written at:

```=shell
layout-repo
└── index.docker.io
    └── library
        └── my-app-image
            └── latest
                ├── blobs
                │   └── sha256
                │       ├── 1bcd5..x               // app image manifest
                │       ├── 2f789..d               // app image config
                │       ├── 824b...f984e           // run layer
                │       ├── f5f7...5b38            // run layer
                │       ├── 870e...f1b09           // run layer
                │       └── 3g234..f               // buildpack layer
                ├── index.json
                └── oci-layout

```

## Proof of concept

In order to validate the feasibility of the proposed feature, we developed a proof of concept with one of the most important side effects this capability can add into the project: **Removing the Daemon Support**. You can also check a recording with the demo in the following [link](https://drive.google.com/file/d/1W1125OHuyUlx88BRroUTLBfrFHhFM5A9/view?usp=sharing)

As mentioned earlier, if we want to remove the daemon support in the Lifecycle, then all the responsibility to deal with it goes into the platforms implementors, that means, for example:
- Pull the require dependencies (runtime image for example), save them on disk in OCI layout format and pass it through the lifecycle using the `<layout-dir>` parameter
- Push the application image (exported in OCI layout format) into the Daemon, because that is what users are expecting.

During the proof of concept implementation I choose to use [skopeo](https://github.com/containers/skopeo) tool to solve the problem of interacting with the Daemon. The reason to do it was **simplicity** for the PoC developed but we believe this is a good subject to talk about with the community.

The following workflow was developed:
- Pack download the [skopeo image](https://github.com/containers/skopeo/blob/main/install.md#container-images), similar as it is downloading the other dependencies (Lifecycle, Buildpacks)
- Pack executes [skopeo copy](https://github.com/containers/skopeo/blob/main/docs/skopeo-copy.1.md)  command in a container
  - Copy image from the Daemon into the filesystem, in OCI layout format, before running Lifecycle
  - Copy image from filesystem into the Daemon after the export phase was executed

The following Dynamic Diagram from the C4 model, can give a little idea of the pieces implemented during the Poc

![](https://i.imgur.com/SkY3l62.png)

### Measuring of performance impact

In order to have an idea on how much is affected the performance of exporting to the Daemon using the OCI layout format, the following metrics were taken.

Using a local workstation with the following specifications:
- **(MacOS 12.3.1 / 2,4 GHz 8-Core Intel Core i9 / 32 GB 2667 MHz DDR4 / 1 TB APFS SSD HD)**

We built 5 times the Java, Kotlin and Ruby samples codes from our [repository](https://github.com/buildpacks/samples/tree/main/apps) and took the building's average time using the Daemon and the OCI layout format approaches.

The table above summarized the results we got.

![](https://i.imgur.com/zuPZ6Xk.png)

Times are expressed in **seconds** and the first thing we noticed is for Java and Kotlin the `build time` can be affected by the network and the availability of maven repositories, so I decided to take the `same build time` to compare both approaches.

Here are my thoughts about these results:
- Java and Kotlin behavior are very similar, exporting only to OCI format increases 5% the time compared to Daemon approach, and from user perspective it represents a 5 seconds increase of time.
- On the other hand for the Ruby application, exporting to OCI format represents a  20% increase of the time but from user perspective it is only 1.5 seconds which is probably difficult to notice from user perspective.
- When the time spent for Pack to prepare the environment for the lifecycle execution (downloading the run-image from a registry to OCI format) and loading the OCI image from disk to the Daemon (which is the expected behavior from Users) is added, then:
  - The Java and Kotlin applications time increases was **13%**, representing **+13 seconds** from user perspective
  - The Ruby application increases **82%** but from user's side it represents **+7 seconds**

Let's take a look on what happened when we execute a build for the second time, the table below summarized the results

![](https://i.imgur.com/zDAOZU6.png)

On these cases we can see the behavior is consistent compared with the previous case, Java and Kotlin application shows a **5% increase** of time but Ruby application, because it's process time is smaller the sensibility to variation is bigger (23%) but in reality it represents a **+1 second** of difference for the User. Also, when the pre and post processing time is added the variations are bigger for all the applications. As mentioned, [skopeo](https://github.com/containers/skopeo) tool was used here and most of the time spent goes into this category.

I think, this PoC demonstrate that adding the exporting to OCI layout format is a valuable feature for the project, it opens the door to deprecate the use of Daemon but it will requires that platform implementors to prepare and post-process the output on disk on a smart way to reduce the performance penalties to users.

# Migration
[migration]: #migration

## For the scope of this RFC

- No breaking changes were identified

# Drawbacks
[drawbacks]: #drawbacks

- We could increase the disk space if we do not manage the duplication of saving the layers on disk. The proposal suggests to use symbolic links to reference layers on disk and avoid duplication.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - Doing nothing, just keep exporting only to Daemon or Registry

- What other designs have been considered for removing the Daemon support?
  - Instead of exporting to OCI layout format, the other approach considered is exporting to [registry only](https://github.com/buildpacks/rfcs/blob/jjbustamante/feature/deprecate-daemon/text/0000-deprecate-daemon.md#lifecycle-registry-only-approach). In this case, the Lifecycle only interacts with registries.
   As part of the PoC, I took some metrics to compare impact of using a ephemeral registry to publish the application image. The strategy done to capture the metrics was:
    - I used a script to set up a local [container registry](https://hub.docker.com/_/registry) before executing the `pack build` command
    - For the **first build** metrics, the registry was destroyed/re-created before each execution
    - `pack build` command was configure to `--publish` in the local registry
    - I didn't use the [skopeo]() in these cases to complete the pushing into the Daemon

  Here are the results:

    ![](https://i.imgur.com/vtOjxJP.png)

     -  The results are actually very similar to exporting to OCI layout format for Java and Kotlin, but Ruby application is actually worst.

    ![](https://i.imgur.com/FfbqfF6.png)

     - Second build is actually better compared with the export to OCI in disk, Java and Kotlin increases the time just by **2%**, but Ruby again is worst

  Some thoughts about this approaches

    - **Process Management:** Platforms must now manage a parallel process (registry in the daemon). This would entail ensuring that the registry is started and cleaned up appropriately.
    - **Networking:** There are additional network complications in order to route images to the ephemeral registry. For example, [network drivers](https://docs.docker.com/network/#network-drivers), [proxy](https://docs.docker.com/desktop/networking/#httphttps-proxy-support) and [DNS configuration](https://docs.docker.com/config/containers/container-networking/#dns-services), [host name resolution](https://docs.docker.com/desktop/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host), and [TLS certificates](https://betterprogramming.pub/deploy-a-docker-registry-using-tls-and-htpasswd-56dd57a1215a) to name a few.

- Why is this proposal the best? [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format is a standard from which other tools can create a [OCI Runtime Specification bundle](https://github.com/opencontainers/runtime-spec/blob/v1.0.0/bundle.md) exporting to this format enables Platforms to implement any feature in the top of this format, for example, exporting to [containerd](https://containerd.io) has been [requested](https://github.com/buildpacks/lifecycle/issues/829) by the community and it could be implemented if we can get the application image exported in [OCI Image Layout](https://github.com/opencontainers/image-spec/blob/main/image-layout.md) format.
- What is the impact of not doing this? Probably will never remove the Daemon support in the Lifecycle

# Prior Art
[prior-art]: #prior-art

- Discussion around removing the Daemon support [RFC](https://github.com/buildpacks/rfcs/blob/jjbustamante/feature/deprecate-daemon/text/0000-deprecate-daemon.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  - Tools like [umoci](https://umo.ci/) used to create a runtime bundle from an image in OCI layout format, requires the [annotation](https://github.com/opencontainers/image-spec/blob/main/annotations.md#pre-defined-annotation-keys) `org.opencontainers.image.ref.name` to be present. Also tools like [skopeo](https://github.com/containers/skopeo) when an image is `copy` in oci format the annotation is included.
  We are not adding the annotation as part of the Buildpacks Specification, but in this case this could make our output incompatible with some other tooling.
    - **Answer:** we agreed on adding `org.opencontainers.image.ref.name` annotation
  - Exporting to a tarball can be handled on this RFC or a new one must be created?
    - **Answer:** this can be handled on a different RFC

- What parts of the design do you expect to be resolved through implementation of the feature?
  - Handle symbolic links to the blobs in the `<layout-dir>` repository, this could be more efficient on hard drive space
    - **Answer:** this can be handled on the implementation side
<!--
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC? -->

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

The [Platform Interface Specification](https://github.com/buildpacks/spec/blob/platform/0.11/platform.md#inputs-5) must be updated to  include the following inputs to the [Create](https://buildpacks.io/docs/concepts/components/lifecycle/create/), [Analyze](https://buildpacks.io/docs/concepts/components/lifecycle/analyze/) and [Export](https://buildpacks.io/docs/concepts/components/lifecycle/export/) phases

| Input | Environment Variable  | Default Value | Description|
|-------|-----------------------|---------------|------------|
| `<layout>`     | `CNB_USE_LAYOUT` | false | Enables the capability of resolving image from/to in OCI layout format on disk |
| `<layout-dir>` | `CNB_LAYOUT_DIR` |  | Path to a directory where the images are saved in OCI layout format|

Also the `analyzed.toml` [file](https://github.com/buildpacks/spec/blob/platform/0.11/platform.md#analyzedtoml-toml) will be updated to include the `reference` format in case of layout is being used.

```=toml
[image]
  reference = "<image reference>"

[run-image]
  reference = "<image reference>"

[previous-image]
  reference = "<image reference>"
```

Where

- `[image|run-image|previos-image].reference` MUST be either:
    - A digest reference to an image in an OCI registry
    - The ID of an image in a docker daemon
    - The path to an image in OCI layout format

