# Meta
[meta]: #meta
- Name: Pack cache options
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): [@jromero](https://github.com/jromero), [@dwillist](https://github.com/dwillist)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

<!-- One paragraph explanation of the feature. -->

Allow users to configure the various cache options.

# Definitions
[definitions]: #definitions

<!-- Make a list of the definitions that may be useful for those reviewing. Include phrases and words that buildpack authors or other interested parties may not be familiar with. -->

#### General

* **bind mounts** - Directories mounted from the docker host system onto the running container.
* **named volumes** - Volumes that are referenced by name within docker and not directly associated with the host file system.
* **lifecycle** - Component that executes in a container running all the necessary buildpacks and producing the final app image.

#### Cache Types
* **build cache** - Cache container `build` layers. That is layers that were created by buildpacks and marked as `build=true` and `cache=true`.
* **launch cache** - Cache containing `launch` layers. That is layers that were created by buildpacks and marked as `launch=true` (regardless of `cache` option).

#### Lifecycle (Platform API) flags
* **`launch-cache` flag** - A flag accepted by the `exporter` phase (and `creator` binary) of the lifecycle to specify a directory where `launch` layers may be stored.
* **`cache-dir` flag** -  A flag accepted by the `exporter` phase (and `creator` binary) of the lifecycle to specify a directory where `cache` layers may be stored.
* **`cache-image` flag** -  A flag accepted by the `exporter` phase (and `creator` binary) of the lifecycle to specify an image on a registry where `cache` layers may be stored.

# Motivation
[motivation]: #motivation

The platform spec currently provides two formats for caching build layers. These formats are a directory or an image.

Additionally, there is an option to specify a _`launch-cache`_ directory to cache launch layers.

> NOTE: Currently _`launch-cache` flag_ is only used by the current implementation of the lifecycle when _`-daemon` flag_ is provided.

Pack, as a consumer of the lifecycle using the platform spec, uses these options in the following ways:

* By default, `pack build` would create two named volumes

<!-- - Why should we do this?
- What use cases does it support?
- What is the expected outcome? -->

##### Use Cases

* As a Pack user, I would like to build using a docker daemon while storing _`build` cache_ as an image (aka _`cache-image`_) in a registry. ([buildpacks/pack#1024](https://github.com/buildpacks/pack/issues/1024#issuecomment-762901676))
* As a Pack user using `pack` on BitBucket Pipelines, I would like to be able to store the _`build` cache_ and _`launch` cache_ on the file system. ([bitbucket discussion](https://community.atlassian.com/t5/Bitbucket-discussions/Using-CNCF-Buildpacks-on-Bitbucket-Pipelines/td-p/1516690))
* As a Pack user, I would like to be able to specify the name of the volumes used by pack for caching. ([buildpacks/pack#665](https://github.com/buildpacks/pack/issues/665))

# What it is
[what-it-is]: #what-it-is

<!-- This provides a high level overview of the feature.

- Define any new terminology.
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
- Explaining the feature largely in terms of examples.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing users and new users. -->

A new variadic flag that enables configuring different cache types geared towards app developers or operators that are using pack in very specific (and sometimes restrictive) ways that require them to configure caching in a more advanced fashion.

The options available via this new flag would have sensible defaults based on the current behaiviour with the exception of the `--cache-image` which would be deprecated and later removed to reduce confusion. Overall UX would remain the same while allowing for greater flexibility.

An additional benefit of this format is that it can later be expanded on if more options for a specific format were deamed necessary.

```
pack build --cache 'type=<type>;format=<format>;<additional-options>' --cache ...
```

### `cache` flag options
* _**type**_ - The type of cache to configure [`build`, `launch`] (default: `build`).
* _**format**_ - The format in which to store that cache [`dir`, `image`, `volume`] (default: `volume`). 

###### Format specific options

* `dir`
    * _**path**_ - Path to the directory to use as cache.
* `image`
    * _**name**_ - Name of the image to use to save as cache (including tag).
* `volume`
    * _**name**_ - Name of the volume to use to save as cache. (default: `pack-<type>-<app-uuid>`)

##### Examples

```bash
# specify named volume build cache
pack build --cache 'type=build;format=volume;name=my-build-cache'

# specify bind mount cache (relative to current working directory)
pack build --cache 'type=build;format=dir;path=./my-build-cache'

# specify named volume build cache (name only)
pack build --cache 'name=my-cool-build-cache'

# specify image cache
pack build --cache 'type=build;format=image;name=io.docker.io/myorg/my-cache:build'

# specify image cache (name only)
pack build --cache 'format=image;name=io.docker.io/myorg/my-cache:build'
```

When no flags are provided the following equate to the defaults:

```
# default when no cache flag is provided
pack build --cache 'type=build;format=volume;name=pack-<type>-<app-uuid>' --cache 'type=volume;format=volume;name=pack-<type>-<app-uuid>'
```

> NOTE: Templating as done internally by Pack for `<type>` and `<app-uuid>` is not a proposed part of this solution.

# How it Works
[how-it-works]: #how-it-works

<!-- This is the technical portion of the RFC, where you explain the design in sufficient detail.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work. -->

Pack would parse the `--cache` flags and apply any options to the two particular cache types. It would take the necessary steps to provide the approprite configuration when executing the lifecycle.

# Drawbacks
[drawbacks]: #drawbacks
<!-- 
Why should we *not* do this? -->

#### Pros

- The fomat is extensible to allow for additional cache formats or additional options.

#### Cons

- There is added complexity in the syntax since it's freeform.
    - Given that the target use cases are more advanced this should be too impactful.

# Alternatives
[alternatives]: #alternatives

<!-- - What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this? -->

### Additional flags

- `--build-cache-dir` - sets the build cache to use a directory at the provided parameter.
- `--build-cache-image` - sets the build cache to use an image with the provided name.
- `--build-cache-volume` - sets the build cache to use an image with the provided name.
- `--launch-cache-dir` - sets the build cache to use a directory at the provided parameter.
- `--launch-cache-volume` - sets the launch cache to use an image with the provided name.

##### Examples

```bash
# specify named volume build cache
pack build --build-cache-volume my-build-cache

# specify bind mount cache (relative to current working directory)
pack build --build-cache-dir ./my-build-cache

# specify named volume build cache (name only)
pack build --build-cache-volume my-cool-build-cache

# specify image cache
pack build --build-cache-image io.docker.io/myorg/my-cache:build
```

When no flags are provided the following equate to the defaults:

```
# default when no cache flag is provided
pack build --build-cache-volume my-app-build-cache --launch-cache-volume my-app-build-cache
```

##### Pros

- Flags are more human readable and minimal.

##### Cons

- Flags need to be treated as exclusive which may add confusion. 
    
    For example the following should be invalid:
    ```
    pack build --build-cache-image <image> --build-cache-volume <volume>
    ``` 
- The number of flags pollute the output of `pack build --help`.
- If additional options are necessary, a new flag must be introduced.

# Prior Art
[prior-art]: #prior-art
<!-- 
Discuss prior art, both the good and bad. -->

* [Docker CLI `--mount` flag](https://docs.docker.com/storage/bind-mounts/):
    `--mount type=bind,source="$(pwd)"/target,target=/app`

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

<!-- - What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC? -->

- Since we will always be pushing the image to a registry (as per [spec](https://github.com/buildpacks/lifecycle/issues/484#issuecomment-754707323)), maybe we should rename format `image` to `registry`? Not to be confused with buildpacks registry...
    `pack build --cache 'format=registry;name=io.docker.io/myorg/my-cache:build'`


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
<!-- Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here. -->
