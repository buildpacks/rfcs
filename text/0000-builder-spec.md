# Meta
[meta]: #meta
- Name: Builder Spec
- Start Date: 2020-09-11
- Author(s): [@dfreilich](https://github.com/dfreilich)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary
A Builder is a critical tool in the CNB ecosystem, and yet, is largely [unspecified][spec-issue-builder]. This RFC proposes that we should add a rigorous versioned specification of builders as an extension to the core specification, and clarify the existence of builders in the:
* [distribution specification][distribution-spec]
* [platform specification][platform-spec]

# Definitions
[definitions]: #definitions
* **[Builder][builder-docs]** &rarr; A **builder** is an image that bundles all the bits and information on how to build your apps, such as buildpacks, an implementation of the lifecycle, and build-time environment that platforms may use when executing the lifecycle.
* **[Buildpack][buildpacks-docs]** &rarr; A **buildpack** is a unit of work that inspects your app source code and formulates a plan to build and run your application.
* **[Platform][platform-docs]** &rarr; A **platform** uses a lifecycle, buildpacks (packaged in a builder), and application source code to produce an OCI image.
* **[Stack][stack-docs]** &rarr; A stack provides the buildpack lifecycle with build-time and run-time environments in the form of images.
* **[Lifecycle][lifecycle-docs]** &rarr; The lifecycle orchestrates buildpack execution, then assembles the resulting artifacts into a final app image.
* **Extension Spec** &rarr; An extension spec defines soemthing that is an optional add-on for Cloud Native Buildpacks systems, but not required to be considered `spec` compliant.

# Motivation
[motivation]: #motivation
Builders are a vital part of the CNB ecosystem as it currently stands; they are used to distribute the lifecycle and buildpacks to many platforms, including:
* pack
* Tekton
* pack-orb
* kpack
etc.

However, at this point, builders are unspecified, and a rigorous technical specification would guarantee a stable API for platforms to develop against.

# What it is
[what-it-is]: #what-it-is
A Builder consists of four items:
* Buildpacks &rarr; A list of buildpack references, and an ordering of buildpacks
* Lifecycle &rarr; A version of a lifecycle implementation
* Stack’s build image &rarr; An environment used at build-time
* Metadata, describing the builder (description, who it was created by, etc) and the stack run images (potentially a list of run-image mirrors as well)

Users of `pack` interact with builders in the following ways:
* `pack build` &rarr; requires a builder to construct an image
* `set-default-builder <builder>` &rarr; Set default builder used by other commands
* `inspect-builder <builder>` &rarr; Show information about a builder
* `suggest-builders` &rarr; Display list of recommended builders
* `trust-builder <builder>` &rarr; Trust builder
* `untrust-builder <builder>` &rarr; Stop trusting builder
* `list-trusted-builders` &rarr; List Trusted Builders
* `create-builder` &rarr; Create builder image

Users of `pack-orb` and `tekton` interact with Builders through supplying a builder to use for building applications. Users of `kpack` can create and use builders.

A sample inspected builder (using `pack inspect-builder`), looks like:
```bash
 $  pack inspect-builder cnbs/sample-builder:bionic
Inspecting builder: cnbs/sample-builder:bionic

REMOTE:

Created By:
  Name: Pack CLI
  Version: 0.13.1+git-4134cc6.build-1135

Trusted: No

Stack:
  ID: io.buildpacks.samples.stacks.bionic

Lifecycle:
  Version: 0.9.1
  Buildpack APIs:
    Deprecated: (none)
    Supported: 0.2, 0.3, 0.4
  Platform APIs:
    Deprecated: (none)
    Supported: 0.3, 0.4

Run Images:
  cnbs/sample-stack-run:bionic

Buildpacks:
  ID                            VERSION        HOMEPAGE
  samples/java-maven            0.0.1          https://github.com/buildpacks/samples/tree/main/buildpacks/java-maven
  samples/kotlin-gradle         0.0.1          https://github.com/buildpacks/samples/tree/main/buildpacks/kotlin-gradle
  samples/ruby-bundler          0.0.1          https://github.com/buildpacks/samples/tree/main/buildpacks/ruby-bundler
  samples/hello-universe        0.0.1          https://github.com/buildpacks/samples/tree/main/buildpacks/hello-universe
  samples/hello-world           0.0.1          https://github.com/buildpacks/samples/tree/main/buildpacks/hello-world
  samples/hello-moon            0.0.1          https://github.com/buildpacks/samples/tree/main/buildpacks/hello-moon

Detection Order:
 ├ Group #1:
 │  └ samples/java-maven@0.0.1
 ├ Group #2:
 │  └ samples/kotlin-gradle@0.0.1
 ├ Group #3:
 │  └ samples/ruby-bundler@0.0.1
 └ Group #4:
    └ samples/hello-universe@0.0.1
       └ Group #1:
          ├ samples/hello-world@0.0.1
          └ samples/hello-moon@0.0.1
```

# How it Works
[how-it-works]: #how-it-works
## Structure of Builders
### Files/Directories
A builder is composed of at least the following directories/files:
```
- /cnb/buildpacks/...<buildpack ID>/<buildpack version>/
- /cnb/lifecycle/<lifecycle binaries>
- /cnb/order.toml
- /cnb/stack.toml
- /layers
- /platform
- /workspace
```

### Env Vars/Labels
A builder's environment is the build-time environment of the stack, and as such, requires all of the [build image specifications][build-image-specs].

Additionally, a builder requires:
* The image config's WorkingDir should be set
* The image config's Env field has the environment variable `CNB_APP_DIR` set to the application directory of the build environment
* The image config's Env field has the environment variable `SERVICE_BINDING_ROOT` set to a directory
* The image config's Labels field has the label io.buildpacks.builder.api, set to a string (defaulting to `0.1`)
* The image config's Labels field has the label io.buildpacks.builder.metadata, set to a JSON object representing [Builder Metadata](#metadata)
* The image config's Labels field has the label io.buildpacks.buildpack.order, set to a JSON object representing an [Order](#order)
* The image config's Labels field has the label io.buildpacks.buildpack.layers, set to a JSON object representing the [buildpack layers](#layers)

If the builder contains an optional [lifecycle descriptor file][lifecycle-descriptor-rfc], it also requires:
* The image config's Labels field has the label io.buildpacks.lifecycle.version, set to the lifecycle version
* The image config's Labels field has the label io.buildpacks.lifecycle.apis, set to a JSON object representing the [lifecycle apis](#lifecycle-apis)

#### Order
The `io.buildpacks.buildpack.order` data should look like:
```json
[
	{
	  "group":
		[
		  {
			"id": "<buildpack id>",
			"version": "<buildpack version>",
			"optional": "<bool>"
		  }
		]
	}
]
```

#### Metadata
The `io.buildpacks.builder.metadata` data should look like:
```json
{
  "description": "<Some description>",
  "stack": {
    "runImage": {
      "image": "<some/run-image>",
      "mirrors": [
        "<gcr.io/some/default>"
      ]
    }
  },
  "buildpacks": [
    {
      "id": "<buildpack id>",
	  "version": "<buildpack version>",
	  "homepage": "http://geocities.com/top-bp"
	}
  ],
  "createdBy": {
    "name": "<creator of builder>", 
    "version": "<builder version>"
  }
}
```

#### Layers
The `io.buildpacks.buildpack.layers` data should look like:
```json
{
  "<buildpack id>": {
    "<buildpack version>": {
      "api": "<buildpack API>",
      "order": [
        {
          "group": [
            {
              "id": "<inner buildpack>",
              "version": "<inner bulidpacks version>"
            }
          ]
        }
      ],
      "layerDiffID": "sha256:test.nested.sha256",
	  "homepage": "http://geocities.com/top-bp"
    }
  },
  "<inner buildpack>": {
    "<inner buildpacks version>": {
      "api": "<buildpack API>",
      "stacks": [
        {
          "id": "<stack ID buildpack supports>",
          "mixins": ["<list of mixins required>"]
        }
      ],
      "layerDiffID": "sha256:test.bp.one.sha256",
	  "homepage": "http://geocities.com/cool-bp"
    }
  }
}
```

### Lifecycle APIs
The `io.buildpacks.lifecycle.apis` data should look like:
```json
{
  "buildpack": {
    "deprecated": ["<list of versions>"],
    "supported": ["<list of versions>"]
  },
  "platform": {
    "deprecated": ["<list of versions>"],
    "supported": ["<list of versions>"]
  }
}
```

## Spec Additions
### Extension Spec
Builders should be specified as an extension spec, and explicitly versioned, using a `<major>.<minor>` pattern, and following the [established spec api release pattern][spec-api-branches]. The version should be persisted in the `io.buildpacks.builder.metadata`, as a top-level `api` field. Versioning will start with 0.1.

### [Platform specification][platform-spec]
We should add a cross-reference to the extension builder specification, noting that a builder is a fully-functioning Stack build image.

### [Distribution specification][distribution-spec]
We should add a cross-reference to the extension builder specification, noting that a builder is also a valid artifact, and is specified in the extension spec.

# Drawbacks
[drawbacks]: #drawbacks
Development Speed &rarr; By specifying the builder spec, it will require more ceremony to make changes, like one to builder metadata

# Alternatives
[alternatives]: #alternatives
* It could be purely in the distribution spec &rarr; There was push-back to this idea, given that platforms don't need to use builders, but can just call the lifecycle directly.
* Versioning could be done through setting a custom OCI mediaType &rarr; That may make the images impossible to manipulate through the docker cli, which would be a big issue.

# Prior Art
[prior-art]: #prior-art
Some similar PRs that led to the development of specifications are:
* [Distribution Specification][distrib-spec-rfc]
* [Service Binding Specification][service-binding-rfc]

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
* This RFC doesn't assume the requirement of a PATH variable, or any other open RFCs  

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This RFC should lead to a new extension spec, and small changes to the distribution and platform spec.

[//]: <> (Links)
[buildpacks-spec]: https://github.com/buildpacks/spec/blob/main/buildpack.md
[platform-spec]: https://github.com/buildpacks/spec/blob/main/platform.md
[distribution-spec]: https://github.com/buildpacks/spec/blob/main/distribution.md
[build-image-specs]: https://github.com/buildpacks/spec/blob/main/platform.md#build-image
[spec-issue-builder]: https://github.com/buildpacks/spec/issues/101
[lifecycle-docs]: https://buildpacks.io/docs/concepts/components/lifecycle/
[stack-docs]: https://buildpacks.io/docs/concepts/components/stack/
[builder-docs]: https://buildpacks.io/docs/concepts/components/builder/
[buildpacks-docs]: https://buildpacks.io/docs/concepts/components/buildpack/
[platform-docs]: https://buildpacks.io/docs/concepts/components/platform/
[distrib-spec-rfc]: https://github.com/buildpacks/rfcs/blob/main/text/0007-spec-distribution.md
[service-binding-rfc]: https://github.com/buildpacks/rfcs/blob/main/text/0012-service-binding.md
[lifecycle-descriptor-rfc]: https://github.com/buildpacks/rfcs/blob/main/text/0049-multi-api-lifecycle-descriptor.md#lifecycle-descriptor
[spec-api-branches]: https://github.com/buildpacks/rfcs/blob/main/text/0027-spec-api-branches.md
