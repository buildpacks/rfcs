# Meta
[meta]: #meta
- Name: Lifecycle Compatibility Verification
- Start Date: 2019-12-06
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Compatibility verification logic is added to all lifecycle executables for the purpose of allowing lifecycle consumers 
to verify the compatibility of the Platform API version.

# Motivation
[motivation]: #motivation

Platforms that don't have the capability to implement complex logic are currently at a disadvantage as
the Platform API changes. These platforms have no common logic to execute to ensure compatibility.

### Use Case: Tekton

A CI platform which utilizes a builder's lifecycle directly has no way of verifying that the Platform API of the
builder it's currently executing against has changed.

In the example diagram below the execution of each individual lifecycle binary is hard-coded along with the arguments.

```text
 PLATFORM
+----------------------------------------------------------------------------------------+
|                                                                                        |
|   RUN CONFIG                                                          OCI REGISTRY     |
|  +----------------+            BUILDER CONTAINER                    +---------------+  |
|  |                |           +----------------------------+        |               |  |
|  | * (IN) BUILDER | +---+---> |                            |   +------>  IMAGE      |  |
|  | * (IN) SOURCE  |     |     |  /cnb/lifecycle/detector   |   |    |               |  |
|  | * (OUT) IMAGE  |     |     |                            |   |    +---------------+  |
|  |                |     |     +----------------------------+   |                       |
|  +----------------+     |                                      |                       |
|                         |      BUILDER CONTAINER               |                       |
|                         |     +----------------------------+   |                       |
|                         |     |                            |   |                       |
|                         +---> |  /cnb/lifecycle/analyzer   |   |                       |
|                         |     |                            |   |                       |
|                         |     +----------------------------+   |                       |
|                         |                                      |                       |
|                         |      ...                             |                       |
|                         |                                      |                       |
|                         |      BUILDER CONTAINER               |                       |
|                         |     +----------------------------+   |                       |
|                         |     |                            |   |                       |
|                         +---> |  /cnb/lifecycle/exporter  +----+                       |
|                               |                            |                           |
|                               +----------------------------+                           |
|                                                                                        |
|                                                                                        |
+----------------------------------------------------------------------------------------+
```

Typically, a platform such as `pack` would inspect the Platform API version and execute the necessary executables
along with the appropriate flags. This is not easily doable for most CI platforms because 1. the Platform API version
is not available to it from within the container, 2. the logic for determining compatibility could become complex.

# What it is
[what-it-is]: #what-it-is

The proposed solution is to add compatibility verification logic to all lifecycle binaries which is executed when an
optional environment variable is present. If no defined environment variable is set, verification will be skipped.
Verification would happen before any other validation. For example, it must happen before validation of flag arguments
passed to the binary.

##### Additional Environment Variables

| Env Var           | Description 
|-------            |---          
| CNB_PLATFORM_API  | The Platform API version of the integration.


##### Additional Exit Codes

| Exit codes        | Description 
|-------            |---          
| 11                | Lifecycle's Platform API version is incompatible with the integration.


### Examples

bash example - no environment variables:
```shell
$ unset CNB_PLATFORM_API
$ /cnb/lifecycle/detector ...
$ echo $?
> 0
```

bash example - compatible example in bash:

```shell
$ export CNB_PLATFORM_API=0.2
$ /cnb/lifecycle/detector ...
$ echo $?
> 0
```

bash example - incompatible example in bash:

```shell
$ export CNB_PLATFORM_API=0.3
$ /cnb/lifecycle/detector ...
> The Lifecycle's Platform API version is 0.2 which is incompatible with Platform API version 0.3.
$ echo $?
> 11
```

Tekton task example:
```yaml
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: buildpacks-v3
spec:
  inputs:
    params:
    - name: BUILDER_IMAGE
      description: The image on which builds will run (must include v3 lifecycle and compatible buildpacks).

  # ...

  stepTemplate:
    env:
    - name: "CNB_PLATFORM_API"
      value: "0.3"

  steps:
  - name: detect
    image: $(inputs.params.BUILDER_IMAGE)
    imagePullPolicy: Always
    command: ["/lifecycle/detector"]
    args:
    - "-app=/workspace/source"
    - "-group=/layers/group.toml"
    - "-plan=/layers/plan.toml"
    volumeMounts:
    - name: "layers-dir"
      mountPath: /layers
  # ...
```


# How it Works
[how-it-works]: #how-it-works

As described in the [Platform API RFC](https://github.com/buildpack/rfcs/blob/master/text/0011-lifecycle-descriptor.md#how-it-works),
changes to the binaries or arguments that are not backwards compatible effectively break the Platform API and thereby
would require the Platform API version to be incremented.

We can use this change in Platform API version within each lifecycle binary to verify compatibility.

# Drawbacks
[drawbacks]: #drawbacks

* This solution would only allow platforms to _fail-fast_ versus attempt to mediate compatibility.
* The initially executed binary may be renamed, moved, or removed. 
    * This would cause a separate unexpected failure which also _fails-fast_ and would be easy to diagnose.

# Alternatives
[alternatives]: #alternatives

### `--platform-api-version` flag

Validate that platform API version is compatible by checking lifecycle executable with additional flag.

##### Pros
* There are no additional executables necessary.
* Gives platforms a way to detect Platform API version.

##### Cons
* This solution would only allow platforms to "fail fast" versus attempt to mediate compatibility.
* Requires platform implementations to make this check and therefore requires understanding of the Platform API version.

bash example:
```shell script
$ /cnb/lifecycle/detector --platform-api-version
> 0.1
```

Tekton task example:
```yaml
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: buildpacks-v3
spec:
  inputs:
    params:
    - name: BUILDER_IMAGE
      description: The image on which builds will run (must include v3 lifecycle and compatible buildpacks).

  # ...

  steps:
    - name: check-compatibility
      image: $(inputs.params.BUILDER_IMAGE)
      imagePullPolicy: Always
      command: ["/bin/sh"]
      args:
      - "-c"
      - test "$(/cnb/lifecycle/detector --platform-api-version)" = "0.1"

  # ...
```

### Wrapper

A `wrapper` would download the declared lifecycle version to execute in the builder. This downloaded lifecycle would
be used in place of the lifecycle embedded in the builder.

##### Pros
* Platform gets to declare lifecycle version it wants to use and therefore there is no possibility of an incompatibility
regarding Platform API version.

##### Cons
* This approach requires downloading an additional component during lifecycle execution. This breaks the contract that
the builder should contain all of the prerequisites to execute the lifecycle.
* Replacing the builder's lifecycle could potentially impact compatibility with its buildpacks as defined by the
Buildpack API version.

Execution example:

```shell script
# step-analyze
./lifecyclew analyze -path -dir

# step-detect
./lifecyclew detect -app -cache
```

Example task:

```yaml
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: buildpacks-v3
spec:
  inputs:
    params:
    - name: BUILDER_IMAGE
      description: The image on which builds will run (must include v3 lifecycle and compatible buildpacks).

  # ...

  stepTemplate:
    env:
    # used by wrapper to download version if it's not what is provided in builder
    - name: "CNB_LIFECYCLE_VERSION"
      value: "0.5.0"
    # directory used for caching lifecycle downloads across steps
    - name: "CNB_LIFECYCLE_HOME"
      value: "/.lifecycle"
  steps:
  - name: detect
    image: $(inputs.params.BUILDER_IMAGE)
    imagePullPolicy: Always
    command: ["/cnb/lifecyclew"]
    args:
    - "detect"
    - "-app=/workspace/source"
    - "-group=/layers/group.toml"
    - "-plan=/layers/plan.toml"
    volumeMounts:
    - name: "layers-dir"
      mountPath: /layers
    - name: "lifecycle"
      mountPath: /.lifecycle
    # ...
```

### Builder supports multiple Platform API version

##### Pros
* A single builder can provide compatibility for multiple platform API versions.
* Platform gets to declare lifecycle version it wants to use and therefore there is no possibility of an
incompatibility regarding Platform API version.

##### Cons
* Builder implementation would increase in both complexity and size. It can further introduce exponential
complexity if we attempt to support more than one version of Buildpack API.

Execution Example:

```shell script
# v0.1 exporter implementation
$ ./lifecycle/v0.1/exporter -path /tmp/cache

# v0.2 exporter implementation
$ ./lifecycle/v0.2/exporter -cacheDir /tmp/cache

# v0.1 cacher
$ ./lifecycle/v0.1/cacher
$ echo $?
> 0

# v0.2 cacher
$ ./lifecycle/v0.2/cacher
> Not Implemented
$ echo $?
> 1
```

### Shim

A thin executable that maps execution calls and their arguments to the appropriate lifecycle binaries based on
Platform API version.

#### Pros
- Provides backwards comparability wherever possible.

#### Cons
- Any logic that can be written at the shim could be written in the lifecycle.

# Prior Art
[prior-art]: #prior-art

* [Gradle wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html) - Concept of downloading required executable via "wrapper"
* [npm doctor](https://docs.npmjs.com/cli/doctor.html) - Comprehensive set of checks (and recommendations) for npm installation

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

* Why not only add it to the initial binary executed (currently `detector`)?