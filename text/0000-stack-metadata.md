# Meta
[meta]: #meta
- Name: Additional Stack Metadata
- Start Date: 2020-05-12
- Author(s): kvedurmu
- RFC Pull Request: (leave blank)
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

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.  

- Define the target persona: stack author  
- Explaining the feature largely in terms of examples.  
The following labels will be added to stack images:  
`io.buildpacks.stack.maintainer`: Name of Stack Maintainer  
`io.buildpacks.stack.homepage`: URL for the stack (i.e repo link)  
`io.buildpacks.stack.distro.name`: Name of OS Distribution  
`io.buildpacks.stack.distro.version`: Version of OS Distribution  
`io.buildpacks.stack.version`: Release Number
`io.buildpacks.stack.release_date`: Release date of image
`io.buildpacks.stack.description`: Description  


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
```

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
None.
