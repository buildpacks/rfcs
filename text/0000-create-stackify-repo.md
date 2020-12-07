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

Stackify can be integrated into Pack in the form of a `pack create-stack` command.

# How it Works
[how-it-works]: #how-it-works
For stacks defined by the buildpacks project, Stackify will add mixins labels for each package installed on the image. If Stackify is used to give add a stack ID other than one defined by the buildpacks project, mixin labels will not be added.

If Stackify is used with an already valid stack image, the `CNB_*` labels and users will not be changed unless new user and group ID's are passed, in which case the labels and user will be overwritten.

If run on the image being "stackify-ed", Stackify can be used to add packages and ca-certificates.

Stackify will use Kaniko to create additional image layers with the additional packages and ca-certificates that users choose to add to their base image. It will also use GGCR to manipulate the image metadata.


### Proposed Interface
Stackify will be run once for each image (build and run):
```
stackify 
  --base-image string
    	Source image ref
  --stack-image string
    	Destination for stack image
  --certs-dir string
    	Path to directory with CA Certs to add to image
  --group-id string
    	CNB Group ID
  --image-type string
    	Type of image to create (build or run)
  --mixins string
    	Comma-separated list of mixins to add to labels
  --packages string
    	Comma-separated list of packages to add to image
  --stack-id string
      Stack ID to add to image metadata
  --user-id string
    	CNB User ID
```

This will be called under the hood by the `pack create-stack` command, which will take a TOML config file:

`pack create-stack my-stack -c /path/to/config.toml`

Config file:
```
[build]
image = "paketobuildpacks/build:base"
outputTag = "some-registry/some-custom-stack-build-image"

[run]
image = "paketobuildpacks/run:base"
outputTag = "some-registry/some-custom-stack-run-image"

[caCerts]

[caCerts.build]
path = "/path/to/dir/with/build-certs"

[caCerts.run]
path = "/path/to/dir/with/run-certs"

[[packages]]
name = "cowsay"

[[packages]]
name = "fortune"
phase = "build"

[[packages]]
name = "rolldice"
phase = "run"

[[mixins]]
name = "set=build-utils"
phase = "build"

[[mixins]]
name = "set=run-utils"
phase = "run"

[[mixins]]
name = "set=shared-utils"

[user]
userID = 1000
groupID = 1000
```

# Drawbacks
[drawbacks]: #drawbacks
* Stackify must be run on the image being "stackify-ed" in order to add ca-certificates and packages.
  * Pack have to run stackify within the image that is being modified.
* If we do not do enough validation, users may be able to successfully use stackify with incompatible or invalid base images.
* Some of the CNB metadata can be difficult to generate, particularly the mixins

# Alternatives
[alternatives]: #alternatives
* Without this tool users can still use Dockerfiles to extend base images and add the CNB metadata.
    * However, this requires them to be aware of all of the relevant metadata needed on the image and maintain a Dockerfile to continuously update their images. 

# Prior Art
[prior-art]: #prior-art
N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
* How much validation should be done on the images, if any?
* It will be challenging to generate a list of common mixins between the build and run images. Is it ok that we will just have `build:<mixin>` and `run:<mixin>` labels and no shared mixins?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
N/A
