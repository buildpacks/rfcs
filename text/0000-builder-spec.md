# Meta
[meta]: #meta
- Name: Builder Spec
- Start Date: 2020-09-11
- Author(s): @dfreilich
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary
A Builder is a critical tool in the CNB ecosystem, and yet, is largely [unspecified][spec-issue-builder]. This RFC proposes that we should add an extension spec, defining builders, as well as clarifying the usage/consumption (or at least, the existence) of builders in the:
* [Buildpack specification][buildpacks-spec]
* [Platform specification][platform-spec]
* [Distribution specification][distribution-spec]

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

This is the technical portion of the RFC, where you explain the design in sufficient detail.

# Drawbacks
[drawbacks]: #drawbacks
N/A

# Prior Art
[prior-art]: #prior-art
Some similar PRs that led to the development of specifications are:
* [Distribution Specification][distrib-spec-rfc]
* [Service Binding Specification][service-binding-rfc]

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This RFC should lead to the creation of a new specification document - either a core, or extension spec. for Builders.

[//]: <> (Links)
[buildpacks-spec]: https://github.com/buildpacks/spec/blob/main/buildpack.md
[platform-spec]: https://github.com/buildpacks/spec/blob/main/platform.md
[distribution-spec]: https://github.com/buildpacks/spec/blob/main/distribution.md
[spec-issue-builder]: https://github.com/buildpacks/spec/issues/101
[stack-docs]: https://buildpacks.io/docs/concepts/components/stack/
[builder-docs]: https://buildpacks.io/docs/concepts/components/builder/
[buildpacks-docs]: https://buildpacks.io/docs/concepts/components/buildpack/
[platform-docs]: https://buildpacks.io/docs/concepts/components/platform/
[distrib-spec-rfc]: https://github.com/buildpacks/rfcs/blob/main/text/0007-spec-distribution.md
[service-binding-rfc]: https://github.com/buildpacks/rfcs/blob/main/text/0012-service-binding.md
