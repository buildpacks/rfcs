# Meta
[meta]: #meta
- Name: Additional Stack Metadata
- Start Date: 2020-05-12
- Author(s): kvedurmu
- Status: Implemented
- RFC Pull Request: [rfcs#78](https://github.com/buildpacks/rfcs/pull/78)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

We currently expose the Stack ID and Mixins via Labels on the build/run images. It would be great if we could leverage Labels to allow stack authors to specify additional image metadata (e.g OS Distro, Maintainer, Stack Version, etc.). The purpose of this RFC is to enumerate on additional metadata we want to expose in our stack images and standardize on these labels.

# Motivation
[motivation]: #motivation

- Why should we do this?  
Exposing additional metadata in stack images will make it easier for end users to debug stack related issues. Also, by exposing this metadata, CNB platforms such as kpack can leverage this information to improve their UX. 
- What is the expected outcome?  
We converge on metadata we want to expose in stack images via labels, and all stack authors eventually support these.

Here's the current output of the `pack inspect-image` command on a sample app:
```
Inspecting image: go-mod-simple-app
...................
LOCAL:

Stack: io.buildpacks.stacks.bionic

Base Image:
  Reference: 610caf01e85e5da52c6a99b42fed80858c153de6d25b120940266846bec0872a
  Top Layer: sha256:b6aadae5b30af0345f0ab82add7ed5b951d78230e86693c08f5c1ae8470a0ffb

Run Images:
  gcr.io/paketo-buildpacks/run:base-cnb
...................
```

By adding the proposed metadata, `pack inspect-image` output of this app could eventually look like:
```
Inspecting image: go-mod-simple-app
...................
LOCAL:

Stack: io.buildpacks.stacks.bionic
Stack Metadata: 
  Maintainer: "Paketo Buildpacks"
  Homepage: "https://github.com/paketo-buildpacks/stacks"
  OS Distro: "unbuntu 18.04"

Base Image:
  Reference: 610caf01e85e5da52c6a99b42fed80858c153de6d25b120940266846bec0872a
  Top Layer: sha256:b6aadae5b30af0345f0ab82add7ed5b951d78230e86693c08f5c1ae8470a0ffb

Run Images:
  gcr.io/paketo-buildpacks/run:base-cnb
...................
```

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.  

- Define the target persona: stack author  
- Explaining the feature largely in terms of examples.  
The following labels can **optionally** be added by stack maintainers to stack images:  
`io.buildpacks.stack.maintainer`: Name of Stack Maintainer  
`io.buildpacks.stack.homepage`: URL for the stack (i.e repo link)  
`io.buildpacks.stack.distro.name`: Name of OS Distribution  
`io.buildpacks.stack.distro.version`: Version of OS Distribution  
`io.buildpacks.stack.version`: Release Number  
`io.buildpacks.stack.release_date`: Release date of image  
`io.buildpacks.stack.description`: Description  
`io.buildpacks.stack.metadata`: Generic stack metadata


# How it Works  
[how-it-works]: #how-it-works  

This is the technical portion of the RFC, where you explain the design in sufficient detail.  
All labels listed above will be added as `Labels` in the stack's Dockerfile.   

Example Dockerfile:
```
ARG cnb_uid=1000
ARG cnb_gid=1000
ARG stack_id="io.buildpacks.stacks.bionic"
ENV CNB_USER_ID=${cnb_uid}
ENV CNB_GROUP_ID=${cnb_gid}
ENV CNB_STACK_ID=${stack_id}
USER ${cnb_uid}:${cnb_gid}
LABEL io.buildpacks.stack.id=${stack_id}
LABEL io.buildpacks.stack.mixins="[\"ca-certificates\"............]"
LABEL io.buildpacks.stack.maintainer="Paketo Buildpacks"
LABEL io.buildpacks.stack.homepage="https://github.com/paketo-buildpacks/stacks/"
LABEL io.buildpacks.stack.distro.name="ubuntu"
LABEL io.buildpacks.stack.distro.version="18.04"
LABEL io.buildpacks.stack.version="25"
LABEL io.buildpacks.stack.release_date="2020-05-12T05:17:02.390472"
LABEL io.buildpacks.stack.description="Paketo Buildpacks base stack build image"
LABEL io.buildpacks.stack.metadata="Some optionally defined metadata"
```
During rebase, the `rebaser` will copy the `io.buildpacks.stack.*` labels from the new run image to the app image.
# Drawbacks
[drawbacks]: #drawbacks

This could make image rebasing slightly more complicated as labels like stack version will need to be updated.  

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?  
It could be more consistent to have a single metadata label (io.buildpacks.stack.metadata) that is structured JSON, but a JSON object would be hard to create in a Dockerfile.  
- Why is this proposal the best?  
It is the simplest way to expose image metadata to users and follows existing conventions with label naming.  
- What is the impact of not doing this?  
Stack authors will define their own custom labels to surface the metadata above. By standardizing on the names and purpose of each of these labels, we make it easier for CNB platforms to consume this metadata.  

# Prior Art
[prior-art]: #prior-art

- Upstream OS distros have an existing pattern of doing this. (e.g `registry.access.redhat.com/ubi8/ubi`)
- Buildpack Homepage field - https://github.com/buildpacks/rfcs/blob/master/text/0030-links-for-buildpacks.md  

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Any additional labels that we'd want to expose?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

The platform spec should be updated to indicate that these keys can **optionally** be added on the build/run stack image.

PR - https://github.com/buildpacks/spec/pull/89
