# Meta
[meta]: #meta
- Name: Create stackify repo
- Start Date: 2020-11-06
- Authors: @martyspiewak @mdelillo @dumez-k
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary
Create a new repo called “stackify” which can be used to turn OCI images into CNB compliant stack images.

# Definitions
[definitions]: #definitions
N/A

# Motivation
[motivation]: #motivation
Currently, for users to extend the published stack images, or turn their own images into stack images, they have to create Dockerfiles which take the base images, apply their changes, and then set the CNB metadata. It can be difficult to generate and set all of the relevant metadata, especially the mixins.

Stackify will be a tool that they can use to perform all of these manipulations to their base image without Dockerfiles.


# What it is
[what-it-is]: #what-it-is
Stackify will be a tool that will be useful to users who would like to customize the published stack images or turn their own base images into CNB compliant stack images.

Users can use stackify to add packages and ca-certificates to a base image as well as add all required CNB metadata to the image.

# How it Works
[how-it-works]: #how-it-works
Stackify will use Kaniko to create additional image layers with the additional packages and ca-certificates that users choose to add to their base image. It will also use GGCR to manipulate the image metadata.

# Drawbacks
[drawbacks]: #drawbacks
* If we do not do enough validation, users may be able to successfully use stackify with incompatible or invalid base images.
* Some of the CNB metadata can be difficult to generate, particularly the mixins

# Alternatives
[alternatives]: #alternatives
* Without this tool users can still use Dockerfiles to extend base images and add the CNB metadata.
    * However, this requires them to be aware of all of the relevant metadata needed on the image and maintain a Dockerfile and pipelines to continuously update their images. 

# Prior Art
[prior-art]: #prior-art
N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
* How much validation should be done on the images, if any?
* It will be challenging to generate a list of common mixins between the build and run images. Is it ok that we will just have `build:<mixin>` and `run:<mixin>` labels and no shared mixins?
* Can this later be integrated into pack, perhaps in the form of a new command (e.g. `pack create-stack`)?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
N/A
