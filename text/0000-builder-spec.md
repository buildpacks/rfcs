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
A Builder is a critical tool in the CNB ecosystem, and yet, is largely [unspecified][spec-issue-builder]. This RFC proposes that we should add a rigorous description of builders in the [distribution specification][distribution-spec], and clarify the usage/existence of builders in the [platform specification][platform-spec]

# Definitions
[definitions]: #definitions
* **[Builder][builder-docs]** &rarr; A **builder** is an image that bundles all the bits and information on how to build your apps, such as buildpacks and build-time image, as well as executes the buildpacks against your app source code.
* **[Buildpack][buildpacks-docs]** &rarr; A **buildpack** is a unit of work that inspects your app source code and formulates a plan to build and run your application.
* **[Platform][platform-docs]** &rarr; A **platform** uses a lifecycle, buildpacks (packaged in a builder), and application source code to produce an OCI image.
* **[Stack][stack-docs]** &rarr; A stack provides the buildpack lifecycle with build-time and run-time environments in the form of images.

# Motivation
[motivation]: #motivation
Builders are a vital part of the CNB ecosystem as it currently stands; they are used to distribute the lifecycle and buildpacks to every platform, including:
* pack
* Tekton
* pack-orb
* kpack
etc.

However, at this point, builders are underspecified, and a rigorous technical specification would fill a needed hole in the current documentation.

# What it is
[what-it-is]: #what-it-is
A Builder consists of four items:
* Buildpacks &rarr; A list of buildpack references, and an ordering of buildpacks
* Lifecycle &rarr; A version of a lifecycle implementation
* Stack’s build image &rarr; An environment used at build-time
* Metadata, describing the builder (description, who it was created by, etc)

Users of `pack` interact with builders in the following ways:
* `pack build` &rarr; requires a builder to construct an image
* `set-default-builder <builder>` &rarr; Set default builder used by other commands
* `inspect-builder <builder>` &rarr; Show information about a builder
* `suggest-builders` &rarr; Display list of recommended builders
* `trust-builder <builder>` &rarr; Trust builder
* `untrust-builder <builder>` &rarr; Stop trusting builder
* `list-trusted-builders` &rarr; List Trusted Builders
* `create-builder` &rarr; Create builder image

Users of `pack-orb`, `tekton`, and `kpack` interact with Builders through supplying a builder to use for building applications.

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
- /platform/env/<env-files>
- /workspace
```

### Env Vars/Labels
A builder's environment is the build-time environment of the stack, and as such, requires all of the [build image specifications][build-image-specs], including:
* The image config's User field is set to a non-root user with a writable home directory.
* The image config's Env field has the environment variable CNB_STACK_ID set to the stack ID.
* The image config's Env field has the environment variable CNB_USER_ID set to the user †UID/‡SID of the user specified in the User field.
* The image config's Env field has the environment variable CNB_GROUP_ID set to the primary group †GID/‡SID of the user specified in the User field.
* The image config's Label field has the label io.buildpacks.stack.id set to the stack ID. (string)
* The image config's Label field has the label io.buildpacks.stack.mixins set to a JSON array containing mixin names for each mixin applied to the image.

Additionally, a builder requires:
* The image config's WorkingDir should be set
* The image config's Label field has the label io.buildpacks.buildpack.order, set to a JSON object representing an [Order](#order)
* The image config's Label field has the label io.buildpacks.builder.metadata, set to a JSON object representing [Builder Metadata](#metadata)
* The image config's Label field has the label io.buildpacks.buildpack.layers, set to a JSON object representing the [layers](#layers)

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
  "lifecycle": {
    "version": "<version of lifecycle in builder>",
    "apis":  {
        "buildpack": {
          "deprecated": ["0.1"],
          "supported": ["1.2", "1.3"]},
        "platform": {
          "deprecated": [],
          "supported": ["2.3", "2.4"]}
    }
  },
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

## Spec Additions
### [Buildpack specification][buildpacks-spec]
Builders don't seem immediately relevant to the buildpack specification; as such, I wouldn't add mention of builders here. 

### [Platform specification][platform-spec]
We can add a note, clarifying that in platforms that use builders, the Stack's build image is the core of the builder. 

### [Distribution specification][distribution-spec]
We should have a rigorous definition of the builder here, with a description of all the files and metadata necessary and allowed. 

# Drawbacks
[drawbacks]: #drawbacks
N/A

# Alternatives
[alternatives]: #alternatives
Specifying the builder is something that, to my mind, should definitely done; the question is, how. We could have an entirely separate `extension spec`, defining builders and how they should be used. 
 > Given that one of the key uses of builders is in distributing buildpacks, I thought it should at least be discussed in some depth in the [distribution spec][distribution-spec], and given that the buildpackage makeup is described there, I thought it appropriate to just describe it fully in the distribution spec. 

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
This RFC should lead to changes in the distribution spec.

[//]: <> (Links)
[buildpacks-spec]: https://github.com/buildpacks/spec/blob/main/buildpack.md
[platform-spec]: https://github.com/buildpacks/spec/blob/main/platform.md
[distribution-spec]: https://github.com/buildpacks/spec/blob/main/distribution.md
[build-image-specs]: https://github.com/buildpacks/spec/blob/main/platform.md#build-image
[spec-issue-builder]: https://github.com/buildpacks/spec/issues/101
[stack-docs]: https://buildpacks.io/docs/concepts/components/stack/
[builder-docs]: https://buildpacks.io/docs/concepts/components/builder/
[buildpacks-docs]: https://buildpacks.io/docs/concepts/components/buildpack/
[platform-docs]: https://buildpacks.io/docs/concepts/components/platform/
[distrib-spec-rfc]: https://github.com/buildpacks/rfcs/blob/main/text/0007-spec-distribution.md
[service-binding-rfc]: https://github.com/buildpacks/rfcs/blob/main/text/0012-service-binding.md
