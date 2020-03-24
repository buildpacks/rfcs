# Meta
[meta]: #meta
- Name: Buildplan & Buildpack Plan Flags
- Start Date: 2020-03-06
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

We would like to add the ability for buildpacks to be able to specify `build` and `launch` requirements for a dependency.
To do so we should add `build` and `launch` fields to both the Build Plan (TOML) and Buildpack Plan (TOML) files.

# Motivation
[motivation]: #motivation
The overarching goal of this RFC is to 

1) Simplifies buildpack implementation.

2) Clarify how buildpacks communicate their dependencies to other buildpacks.

State of Cloudfoundry Buildpacks:

- The current method that the Cloudfoundry Buildpacks use to indicate they rely on an earlier buildpack's dependencies is to set a string `build` and/or `launch` field in the Build Plan (TOML) `requires.metadata` section.
- the throwing this information in the `requires.metadata` obfuscates the flow of `build` and `launch` flags from dependencies to the Layer Metadata.  
- This implicit contract between dependent buildpacks should be formalized.

#### Example:
 We consider the interactions between the Cloudfoundry `node-engine-cnb` and `npm-cnb`
 
 - The `node-engine-cnb` provides the `npm` dependency to an image, but only for the `launch` phase.
 - The `npm-cnb` requires `npm` during the `build` phase, and so it adds an entry in `requires.metadata` to reflect this need.
 - As a result during the `node-engine-cnb`'s build phase all `entries.metadata` must be parsed for `build` and `launch` to determine the correct flags to attach to the `npm` dependency Layer Metadata.
  
# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define the target persona: Buildpack Author
  
Currently, we have the following fields in the Layer Content Metadata (TOML) file: 
  
  ```toml
  launch = false
  build = false
  cache = false
  
  [metadata]
  # buildpack-specific data
  ```
  
  `build`, `launch` and `cache` are all well defined in this file and represent properties on the layer.
  
  The BuildPlan & Buildpack Plan files that are consumed during detection & build to produce the Layer Content Metadata file
   do not include any of these flags.

## BuildPlan Changes
  
We propose adding `build` and `launch` fields to dependencies in the Build Plan (TOML) file. 
  
  Note that in this case `cache` does not make sense as this is strictly a property of a layer and is omitted.
  
  We propose adding the following to the Build Plan (TOML):
  
  ```toml
  [[provides]]
  name = "<dependency name>"
  
  [[requires]]
  name = "<dependency name>"
  version = "<dependency version>"
  build = false
  launch = true
  
  [requires.metadata]
  some_metadata_key = "some_metadata_value"
  # buildpack-specific data
  
  [[or]]
  
  [[or.provides]]
  name = "<dependency name>"
  
  [[or.requires]]
  name = "<dependency name>"
  version = "<other dependency version>"
  build = true
  launch = false
  
  [or.requires.metadata]
  some_other_metadata_key = "some_other_metadata_value"
  # buildpack-specific data
  
  ```
  
## Buildpack Plan (TOML) changes
  
  For the same reasons, we would like to add `build` and `launch` flags to the Buildpack Plan, along with
  some additional format changes: 

  ```toml
  [[entries]]
  name = "<dependency name>"
  build = false
  launch = false
  
  [[entries.requires]]
  version = "<dependency version>"
  
  [entries.requires.metadata]
  # buildpack-specific data
  ```
In each entry the `name` field is **unique**.

  We arrived at this format for several reasons:
  
  - It allows us to offload some common flag merging operations to the lifecycle. We suggest letting all build/launch flags
  under a single key be merged together (recommending the `or` operator). 
  - A buildpack only needs to handle logic based on `name` keys it is responsible for. 
 
# How it Works
[how-it-works]: #how-it-works

The additional fields to the Build Plan (TOML) should be self explanatory and are strictly additive.
But will move these values out the `metadata` field.

The proposed changes in this solution to the Buildpack Plan (TOML) would require the following changes to the lifecycle to 
generate data in the format defined above:

- Detection Succeeds
- Build Plan entries are aggregated based on dependency-names.
- Each dependency has an array for all versions and map for metadata that appeared under that dependency name in the Build Plan
- build & launch flags of each entry are reduced using some boolean operator (likely `or`) 

The result of processing the example Build Plan above would be the following: 

  ```toml
  [<dependency name>]
  build = true
  launch = true
  
  [[<dependency name>.entries]]
  version = "<dependency version>"

  [<dependency name>.entries.metadata]
    some_metadata_key = "some_metadata_value"

  [[<dependency name>.entries]]
  version = "<other dependency version>"
  
  [<dependency name>.entries.metadata]
  some_other_metadata_key = "some_other_metadata_value"
  # buildpack-specific data
  ```
  
#### Example:
 We consider interactions between the Cloudfoundry `node-engine-cnb` and `npm-cnb` using this new format
 
 - The `node-engine-cnb` provides the `npm` dependency to an image, but only for the `launch` phase.
 - The `npm-cnb` requires `npm` during the `build` phase, and so it sets the `requires.build`  values to `true`.
 - During the `node-engine-cnb`'s build phase we examine the Buildpack Plan `entries` for one named `npm` and retrieve the `build` & `launch` flags.

# Drawbacks
[drawbacks]: #drawbacks
     
This would be a breaking change for consumers of the Buildpack Plan. Though there are alternative methods to represent
this data. All have their own discrepancies between the data-formats and their semantics.



# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

This information could also be represented as additional information added to the Buildpack Plan as follows:

```toml
[[entries]]
name = "<dependency name>"
version = "<dependency version>"

[[entries]]
name = "<dependency name>"
version = "<dependency version2>"

[[entries]]
name = "<dependency name2>"
version = "<dependency version>"

[[merged-layer-flags]]
name = "<dependency name>"
build = false
launch = true

[[merged-layer-flags]]
name = "<dependency name2>"
build = true
launch = false
```

- Here `<dependency name>` elements in the `merge-layer-flags` array should have unique `name` fields

- Why is this proposal the best?
The above is non breaking, but it divides data for a single entity among multiple structures & leaves matching up to the buildpack author, this feels bad.


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Is there a better data format for the Buildpack Plan?

