# Meta
[meta]: #meta
- Name: Add Image Manifest Size to report.toml
- Start Date: 2020-11-02
- Author(s): djoyahoy
- Status: Implemented
- RFC Pull Request: [rfcs#121](https://github.com/buildpacks/rfcs/pull/121)
- CNB Pull Request:
- CNB Issue: [buildpacks/spec#169](https://github.com/buildpacks/spec/issues/169), [buildpacks/lifecycle#490](https://github.com/buildpacks/lifecycle/issues/490)
- Supersedes: N/A

# Summary
[summary]: #summary

Add the final image manifest size in bytes to the `report.toml` file. The size reported is analogous to the size reported by docker push.
For example, the following has a size of 528 bytes:
```
$ docker push localhost:5000/alpine
The push refers to repository [localhost:5000/alpine]
...
...
...
latest: digest: sha256:a15790640a6690aa1730c38cf0a440e2aa44aaca9b0e8931a9f2b0d7cc90fd65 size: 528
``` 

More concretely, this is the size of the v2 manifest as returned by `curl -H "Accept: application/vnd.docker.distribution.manifest.v2+json" localhost:5000/v2/alpine/manifests/latest` from the example above. 

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

* This will bring `report.toml` in line with the output reported by docker push.
* This will allow the platform easy access to the manifest size. For example, the manifest size is required when integrating with [Notary V1](https://github.com/pivotal/kpack/blob/notary-rfc/rfcs/0001-notary-integration.md). 


# What it is
[what-it-is]: #what-it-is

During the export phase, the image manifest size in bytes should be written to the `report.toml` file.

# How it Works
[how-it-works]: #how-it-works

During export, get the V2 image manifest in the canonical JSON format and determine it's size in bytes. Then, set that value on the report object.

The following field would be added to the `report.toml`:
```
[image]
tags = ["<tag reference>"]
digest = "<image digest>"
image-id = "<imageID>"
manifest-size = <manifest size in bytes>

[build]
[[build.bom]]
name = "<dependency name>"

[build.bom.metadata]
version = "<dependency version>"
```

For example:
```
[image]
tags = ["localhost:5000/alpine:latest"]
digest = "sha256:a15790640a6690aa1730c38cf0a440e2aa44aaca9b0e8931a9f2b0d7cc90fd65"
manifest-size = 528
...
...
...
```

# Drawbacks
[drawbacks]: #drawbacks

N/A

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

This would be the exact same size as reported by docker push.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

The name of the field is subject to change.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC would add a new field to the `report.toml` file:
```
[image]
tags = ["<tag reference>"]
digest = "<image digest>"
image-id = "<imageID>"
manifest-size = <manifest size in bytes>

[build]
[[build.bom]]
name = "<dependency name>"

[build.bom.metadata]
version = "<dependency version>"
```
