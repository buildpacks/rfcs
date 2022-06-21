# Meta

- Name: kpack donation to CNB
- Start Date: 2022-06-21
- Author(s): [Juan Bustamante](https://github.com/jjbustamante/)
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary

This RFC proposes the donation of the open-source project [kpack](https://github.com/pivotal/kpack/) into the [Cloud Native Buildpack](https://buildpacks.io/) (CNB) ecosystem.

# Definitions

- [Kubernetes](https://kubernetes.io/) is an open-source system for automating deployment, scaling, and management of containerized applications.
- [Kpack](https://github.com/pivotal/kpack/) is a VMware-led open-source project that utilizes [Kubernetes](https://kubernetes.io/) primitives to build OCI images as a [platform](https://buildpacks.io/docs/concepts/components/platform/) implementation of [Cloud Native Buildpacks](https://buildpacks.io/).
- A Kubernetes native application is an application designed to run on Kubernetes platforms, managed by Kubernetes APIs and `kubectl` tooling and cohesively deployed on Kubernetes as a single object.

# Motivation

### Why should we do this?

It will benefit the [CNB](https://buildpacks.io/) project by adding a tool to support an out-of-the box [Kubernetes](https://kubernetes.io/) integration, which is part of the [CNB](https://buildpacks.io/) [roadmap](https://github.com/buildpacks/community/blob/main/ROADMAP.md#integration-with-the-cloud-native-ecosystem) goals.

It will show evidence to the community that the project supports multiple [platform interface specification](https://github.com/buildpacks/spec/blob/main/platform.md) implementers increasing community's confidence on the flexibility of specification maintained by the [CNB](https://buildpacks.io/) project.

It will help the [CNB](https://buildpacks.io/) community (+550 members on slack channel) to grow by adding all the [kpack](https://github.com/pivotal/kpack/) community into [CNB](https://buildpacks.io/) space.

[CNB](https://buildpacks.io/) is part of the [Cloud Native Computing Foundation](https://www.cncf.io), an open source, vendor neutral hub of cloud native computing projects, the inclusion of [kpack](https://github.com/pivotal/kpack/) under this umbrella will provide more opportunity to the community:

- Increase in adopters, users looking to use buildpacks in [Kubernetes](https://kubernetes.io/) will find a tool supported and maintained by the [CNB team](https://github.com/buildpacks/community/blob/main/TEAMS.md).
- Improve efficiency, ensuring that the roadmaps of the two projects are closer aligned will make it easier to coordinate efforts between both communities.

### What use cases does it support?

[kpack](https://github.com/pivotal/kpack/)  will add support to operators by providing declarative [Kubernetes](https://kubernetes.io/) resources (images, builders, or stacks for example) to monitor for security patches on the underlying builder's buildpacks or stacks and rebuild the OCI image when changes are detected, allowing platforms to roll out new versions of the applications when vulnerabilities are fixed.

### How does kpack support the goals and use cases of the project?

The [CNB](https://buildpacks.io/) project turns application source code into OCI-compliant container images; in order to do that, it defines a platform-to-buildpack contract that guarantees interoperability between different implementers.

The [CNB](https://buildpacks.io/) project embraces modern container standards, and [Kubernetes](https://kubernetes.io/) has become the industry standard for automating deployment, scaling, and management of containerized applications.

[kpack](https://github.com/pivotal/kpack/) fits perfectly in that direction because it implements the [platform interface specification](https://github.com/buildpacks/spec/blob/main/platform.md) and because is a [Kubernetes](https://kubernetes.io/) native application its community possesses a vast knowledge that can provide valuable feedback to the CNB project.

### Is there functionality in kpack that is already provided by the project?

[pack](https://github.com/buildpacks/pack) and [kpack](https://github.com/pivotal/kpack/) offer similar functionality (both tools implement the [platform interface](https://github.com/buildpacks/spec/blob/main/platform.md)[specification](https://github.com/buildpacks/spec/blob/main/platform.md)) but they do it for two non-overlapping contexts: while the first one targets developers and local builds, [kpack](https://github.com/pivotal/kpack/) manages containerization on day-2 and at scale and is a [Kubernetes](https://kubernetes.io/) native implementation.

### Is kpack integrated with another service or technology that is widely used?

As mentioned earlier, [kpack](https://github.com/pivotal/kpack/) implements the [platform interface specification](https://github.com/buildpacks/spec/blob/main/platform.md) on [Kubernetes](https://kubernetes.io/), a standard nowadays for automating deployment, scaling, and management of containerized applications.

# What it is

[Kubernetes](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/) is a portable, extensible, open-source platform for managing containerized workloads and services. The [Kubernetes](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/) API can be extended in different ways; one of them is using [custom resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/), a custom resource represents a customization of a particular [Kubernetes](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/) installation.

[kpack](https://github.com/pivotal/kpack/) extends [Kubernetes](https://kubernetes.io/) using [custom resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) and utilizes unprivileged [Kubernetes](https://kubernetes.io/) primitives to provide builds of OCI images as a platform implementation of [Cloud Native Buildpacks](https://buildpacks.io/). This means that [kpack](https://github.com/pivotal/kpack/) takes the CNB-defined concepts (image, builder, stacks, etc) and bakes them into the Kubernetes extension model using custom resources and exposing a declarative API for interacting with it.

The declarative API enforces a separation of responsibilities. Operators declare the configuration for a CNB image or define which buildpacks or stacks must be used, and [kpack](https://github.com/pivotal/kpack/) - using its custom controller - will take care of the heavy lifting, keeping the state of the custom objects in sync with the declared desired state.

# How it Works

As mentioned before, [kpack](https://github.com/pivotal/kpack/) uses the [custom resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) extension point to provide the capabilities of building OCI images as a platform implementation of [Cloud Native Buildpacks](https://buildpacks.io/).

These custom resources have a common definition similar to this:

```yaml
apiVersion: kpack.io/v1alpha2
kind: [ClusterStack|ClusterStore|Image|Builder|Build]
metadata:
  name: [unique name]
```

The _apiVersion_ key specifies which version of the Kubernetes API is used to create the object, in this case **kpack.io/v1alpha2**

The _kind_ key specifies what kind of objects we want to create for example: **ClusterStack, ClusterStore, Image, Builder or Build**

The _metadata_ key is used to define the data that can uniquely identify the object. One common key used around all the custom resources is to provide a _name_ to identify the object.

Some of the [custom resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) implemented by [kpack](https://github.com/pivotal/kpack/) are describe in the next section, if you want to check the complete reference go to [kpack](https://github.com/pivotal/kpack/)  documentation [site](https://github.com/pivotal/kpack/tree/main/docs)

## ClusterStack

This resource is an abstraction to group a `build image` and a `run image` required to build the application source code.

Let's see an example of the [ClusterStack](https://github.com/pivotal/kpack/blob/main/docs/stack.md) definition

```yaml
apiVersion: kpack.io/v1alpha2
kind: ClusterStack
metadata:
  name: base
spec:
 id: "io.buildpacks.stacks.bionic"
 buildImage:
   image: "my-buildpack-repo/build:cnb"
 runImage:
   image: "my-buildpack-repo/run:cnb"
```

The _spec_ key is used to define the desired state of the ClusterStack and the keys availables under _spec_ match the values expected in a CNB [stack](https://buildpacks.io/docs/concepts/components/stack/) definition:

- _id_: The 'id' of the stack
- _buildImage.image_: The `build-image` of the [stack](https://buildpacks.io/docs/concepts/components/stack/).
- _runImage.image_: The `run-image` of the [stack](https://buildpacks.io/docs/concepts/components/stack/).

## Cluster Store

Creates a repository of buildpacks packaged as OCI artifacts to be used during a build.

Let's see an example of the [ClusterStore](https://github.com/pivotal/kpack/blob/main/docs/store.md) definition

``` yaml
apiVersion: kpack.io/v1alpha2
kind: ClusterStore
metadata:
  name: my-cluster-store
spec:
 sources:
   - image: foo.com/my-buildpack-repo/buildpack-1@sha256:sha123
   - image: foo.com/my-buildpack-repo/buildpack-2@sha256:sha345
   - image: foo.com/my-buildpack-repo/builder:base
 ```

The _spec_ key is used to define the desired state of the [ClusterStore](https://github.com/pivotal/kpack/blob/main/docs/store.md)

- _sources_: List of buildpackage images to make available in the ClusterStore. Each image is an object with the key _image_.

As a side note the [ClusterStore](https://github.com/pivotal/kpack/blob/main/docs/store.md) resource will be deprecated in favor of a new Buildpack resource in the near future according to the following [RFC](https://www.google.com/url?q=https://github.com/pivotal/kpack/pull/931&sa=D&source=docs&ust=1665521917723122&usg=AOvVaw1eNN-XzLf5xiX1nvrHKMRE)

## Builder or ClusterBuilder

Creates a [CNB builder](https://buildpacks.io/docs/concepts/components/builder/) image that contains all the components necessary to execute a build.

An example of the [Builder](https://github.com/pivotal/kpack/blob/main/docs/builders.md) definition is as follows:

```yaml
apiVersion: kpack.io/v1alpha2
kind: Builder
metadata:
  name: my-builder
spec:
  tag: foo.com/sample/builder
  stack:
    name: base
    kind: ClusterStack
  store:
    name: my-cluster-store
    kind: ClusterStore
  order:
    - group:
      - id: my-buildpack-repo/buildpack-1
    - group:
      - id: my-buildpack-repo/buildpack-2
 ```

It's important to notice that a [ClusterStack](https://github.com/pivotal/kpack/blob/main/docs/stack.md) and [ClusterStore](https://github.com/pivotal/kpack/blob/main/docs/store.md) is required for creating a [Builder](https://github.com/pivotal/kpack/blob/main/docs/builders.md).

The _spec_ key is used to define the desired state of the [Builder](https://github.com/pivotal/kpack/blob/main/docs/builders.md)

- _tag_: The tag to save the builder image.
- _stack.name_: The name of the stack resource to use as the builder stack. All buildpacks in the order must be compatible with the [ClusterStack](https://github.com/pivotal/kpack/blob/main/docs/stack.md).
- _stack.kind_: The type as defined in [Kubernetes](https://kubernetes.io/). This will always be [ClusterStack](https://github.com/pivotal/kpack/blob/main/docs/stack.md).
- _store.name_: The name of the [ClusterStore](https://github.com/pivotal/kpack/blob/main/docs/store.md) resource in [Kubernetes](https://kubernetes.io/).
- _store.kind_: The type as defined in [Kubernetes](https://kubernetes.io/). This will always be [ClusterStore](https://github.com/pivotal/kpack/blob/main/docs/store.md).
- _order_: The [builder order](https://buildpacks.io/docs/reference/builder-config/).

The [ClusterBuilder](https://github.com/pivotal/kpack/blob/main/docs/builders.md#cluster-builders) resource is almost identical to a [Builder](https://github.com/pivotal/kpack/blob/main/docs/builders.md) but it is a cluster scoped resource that can be referenced by an [Image](https://github.com/pivotal/kpack/blob/main/docs/image.md) in any namespace.

## Build

Custom resource responsible for scheduling and running a single build.

An example of a [Build](https://github.com/pivotal/kpack/blob/main/docs/build.md) definition is

```yaml
apiVersion: kpack.io/v1alpha2
kind: Build
metadata:
  name: sample-build
spec:
  tags:
    -sample/image
  builder:
    image: foo.com/sample/builder
  projectDescriptorPath: path/to/project.toml
  source:
    git:
      url: https://github.com/my-account/sample-app.git
      revision: main
```

The _spec_ key is used to define the desired state of the [Build](https://github.com/pivotal/kpack/blob/main/docs/build.md)

- _tags_: A list of tags to build. At least one tag is required.
- _builder.image_: This is the tag to the [Cloud Native Buildpacks builder image](https://buildpacks.io/docs/concepts/components/builder/) to use in the build.
- _source_: The source location that will be the input to the build.
- _projectDescriptorPath_: Path to the [project descriptor file](https://buildpacks.io/docs/reference/config/project-descriptor/) relative to source root dir or subPath if set.

## Image

Provides a configuration to build and maintain an OCI image utilizing [CNB](https://buildpacks.io/).

An example of an [Image](https://github.com/pivotal/kpack/blob/main/docs/image.md) definition is as follows

```yaml
apiVersion: kpack.io/v1alpha2
kind: Image
metadata:
  name: my-app-image
  namespace: default
spec:
  tag: foo.com/my-app-repo/my-app-image
  builder:
    name: my-builder
    kind: Builder
  source:
    git:
      url: https://github.com/my-account/sample-app.git
      revision: 82cb521d636b282340378d80a6307a08e3d4a4c4
```

The _spec_ key is used to define the desired state of the [Image](https://github.com/pivotal/kpack/blob/main/docs/image.md)

- _tag_: The image tag.
- _builder_: Configuration of the [builder](https://github.com/pivotal/kpack/blob/main/docs/builders.md) resource the image builds will use.
- source: The source code that will be monitored/built into images.

# Migration

### Repositories

The suggested strategy for migrating [kpack's](https://github.com/pivotal/kpack/)  git repositories to the [CNB](https://buildpacks.io/) is to use the [transfer repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository#transferring-a-repository-owned-by-your-organization) git feature.

The following table shows the candidates repositories to be transferred

| Origin Repo | Description | Owner | Destination Repo | Owner |
| --- | --- | --- | --- | --- |
| [https://github.com/pivotal/kpack](https://github.com/pivotal/kpack) | kpack source code | Pivotal | [https://github.com/buildpacks/kpack](https://github.com/buildpacks/kpack) | [CNB Technical Oversight Committee](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#technical-oversight-committee) |
| [https://github.com/vmware-tanzu/kpack-cli](https://github.com/vmware-tanzu/kpack-cli) | kpack CLI | VMware | [https://github.com/buildpacks/kpack-cli](https://github.com/buildpacks/kpack-cli) | [CNB Technical Oversight Committee](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#technical-oversight-committee) |
| [https://github.com/vmware-tanzu/homebrew-kpack-cli](https://github.com/vmware-tanzu/homebrew-kpack-cli) | Homebrew tap for the kpack CLI | VMware | [https://github.com/buildpacks/homebrew-kpack-cli](https://github.com/buildpacks/homebrew-kpack-cli) | [CNB Technical Oversight Committee](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#technical-oversight-committee) |

For each repository

- The owner or admin user must follow the steps describe in github [documentation](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository#transferring-a-repository-owned-by-your-organization) and transfer the repository to the organization [Cloud Native Buildpacks](https://github.com/buildpacks)
- A member of the [TOC team](https://github.com/orgs/buildpacks/teams/toc/members) in [CNB](https://buildpacks.io/) must accept the donation of the repository. The name of the destination repository will be the one described in the table above.

### CI / CD Pipelines

[kpack's](https://github.com/pivotal/kpack/) CI/CD infrastructure currently runs on internal VMware infrastructure. [kpack's](https://github.com/pivotal/kpack/) CI/CD pipelines will need to be rebuilt on [CNB](https://buildpacks.io/) infrastructure.

### Documentation

[Kpack](https://github.com/pivotal/kpack/) documentation is currently hosted in the base code [repository](https://github.com/pivotal/kpack/tree/main/docs), after migrating to [CNB](https://buildpacks.io/) the documentation will be published into the Cloud Native Buildpack [site](https://buildpacks.io/).

[CNB](https://buildpacks.io/) already mentioned [kpack](https://github.com/pivotal/kpack/) in their documentation, specifically, in the tools section. The proposal is:

- Create a new folder name **kpack** inside the [tool](https://github.com/buildpacks/docs/tree/main/content/docs/tools) section in the docs repository
- Copy kpack's [documentation](https://github.com/pivotal/kpack/tree/main/docs) into this new created folder
- Update the references and all the required elements to format the documentation according to [CNB](https://buildpacks.io/) site

### Governance

Based on the [CNB governance policy](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md) and the fact that [kpack](https://github.com/pivotal/kpack/) is a [platform](https://buildpacks.io/docs/concepts/components/platform/) implementation of [Cloud Native Buildpacks](https://buildpacks.io/), it will be added under the responsibility of the [CNB Platform Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#Platform-Team).

How do migrate roles and responsibilities into the CNB governance process?

Currently the [CNB Platform Team](https://github.com/buildpacks/community/blob/main/TEAMS.md#Platform-Team) already has a **team lead** assigned and, by definition, each team can have only one **team lead**. In order to provide the current [kpack](https://github.com/pivotal/kpack/) team with the same accountability for the migrated repositories the proposal is to follow the guidelines describe on the [Component Maintainer Role RFC](https://github.com/buildpacks/rfcs/pull/234)

# Risks

- It's not clear how to handle the budget required to finance the infrastructure to rebuild the CI/CD pipelines on CNCF CNB infrastructure.
- Evaluate any legal requirement from [CNCF](https://www.cncf.io) that must be fulfilled before accepting the project into the [CNB](https://buildpacks.io/) ecosystem.
- Relying on the approval of [Component Maintainer Role RFC](https://github.com/buildpacks/rfcs/pull/234) to guarantee current [kpack](https://github.com/pivotal/kpack/) maintainers could keep supporting the project after the donation.

# Drawbacks

Why should we _not_ do this?

- If the [CNB](https://buildpacks.io/) team expects to implement a different kind of integration with [Kubernetes](https://kubernetes.io/), then accepting the donation of [kpack](https://github.com/pivotal/kpack/) could conflict with that strategy.
- Another component to maintain which requires additional context and expertise in [Kubernetes](https://kubernetes.io/).

# Alternatives

- What other designs have been considered?
  - [VMware](https://www.vmware.com/) could continue to control the project, but it doesn't help on increase the adoption because it remains as a single-vendor driven project
  - [VMware](https://www.vmware.com/) could donate [kpack](https://github.com/pivotal/kpack/) to the [Continuous Delivery Foundation](https://cd.foundation/), but [CNB](https://buildpacks.io/) presents a natural home for [kpack](https://github.com/pivotal/kpack/)  (it is an implementation of the platform specification)
  - [VMware](https://www.vmware.com/) could create a new [CNCF](https://www.cncf.io/) project and move all [kpack](https://github.com/pivotal/kpack/) resources to it, but in this case it would need to undergo as a sandbox project for example.

- Why is this proposal the best?

[kpack](https://github.com/pivotal/kpack/) is a mature Kubernetes-native tool that leverages buildpacks and is used in production environments. The project's maintainers and contributors possess valuable technical and user context, derived from developing [kpack](https://github.com/pivotal/kpack/) and integrating feedback from users utilizing [CNB](https://buildpacks.io/) concepts when presented as part of Kubernetes resources.

- What is the impact of not doing this?

The [CNB](https://buildpacks.io/) community would have to develop from scratch any kind of integration with the Cloud Native Ecosystem to satisfy the project goals.

**Prior Art**

- Guidelines for accepting component-level contributions [RFC #143](https://github.com/buildpacks/rfcs/pull/143)
- Component Maintainer Role [RFC #234](https://github.com/buildpacks/rfcs/pull/234)

# Unresolved Questions

See the risks section

# Spec. Changes (OPTIONAL)

None
