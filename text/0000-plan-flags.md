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
To do so we should add `build` and `launch` fields to the Build Plan (TOML). We would also like these flags
 to be available in Buildpack Plan (TOML) files.

# Motivation
[motivation]: #motivation

1) Simplifies buildpack implementation.

2) Clarify how buildpacks communicate their dependencies to other buildpacks.

- Current state of the world.
    The current way that the Cloudfoundry Buildpacks indicate that they rely on an earlier buildpack's dependencies at either build or 
    launch time is to set a string `build` and/or `launch` field in the Build Plan (TOML) metadata section. An example 
    of this being necessary is say the the `node-engine-cnb` and the `npm-cnb`. The `node-engine-cnb` on its own only 
    has the `launch` metadata set for its layer because that is all that is required to run a node app that has no 
    external dependencies. This is a problem when the `npm-cnb` get involved. The `npm-cnb` needs dependencies from the 
    `node-engine-cnb` during both build and launch times. In order for this to happen the `npm-cnb` adds the ad hoc 
    keys to the Build Plan (TOML) metadata field and then those fields have to be parsed inside of `node-engine-cnb`.
  
# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define the target persona:
  
  The target persona for this change: buildpack authors

- Explaining the feature largely in terms of examples.
  
  (this is the final result )
  Currently: We have the following fields in the Layer Content Metadata (TOML) file: 
  ```toml
  launch = false
  build = false
  cache = false
  
  [metadata]
  # buildpack-specific data
  ```
  
  `build`, `launch` and `cache` are all well defined in this file. And represent properties on the layer.
  
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
  some_metadata_key = some_metadata_value
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
  some_other_metadata_key = some_other_metadata_value
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
We will also guarantee that for each entry the `name` field is unique.

  We arrived at this format for several reasons:
  - It allows us to offload some common flag merging operations to the lifecycle. We suggest letting all build/launch flags
  under a single key be merged together (recommending the `or` operator). 
  
  - A buildpack only needs to handle logic based on `name` keys it is responsible for. 
 
# How it Works
[how-it-works]: #how-it-works

The overarching goal of this RFC is to formalize the flow of the `build` and `launch` flags through the `detect` and `build`
phases. 

The additional fields to the Build Plan (TOML) should be self explanitory and are strictly additive.
But will move these values out the `metadata` field.

The proposed changes in this solution to the Buildpack Plan (TOML) would require the following changes to the lifecycle to 
generate data in the format defined above:

- Detection Succeeds
- Build Plan entries are aggregated based on dependency-names.
- Each dependency has an array for all the versions & map for metadata that appeared under that dependency name in the Build Plan
- build & launch flags of each entry are reduced using some boolean operator (likely `or`) 

The result of processing the example Build Plan above would be the following: 

  ```toml
  [<dependency name>]
  build = true
  launch = true
  
  [[<dependency name>.entries]]
  version = "<dependency version>"

  [<dependency name>.entries.metadata]
    some_metadata_key = some_metadata_value

  [[<dependency name>.entries]]
  version = "<other dependency version>"
  
  [<dependency name>.entries.metadata]
  some_other_metadata_key = some_other_metadata_value
  # buildpack-specific data
  ```

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
build = bool
launch = bool

[[merged-layer-flags]]
name = "<dependency name2>"
build = bool
launch = bool
```

- Here `<dependency name>` elements in the `merge-layer-flags` array should have unique `name` fields

- Why is this proposal the best?
The above is non breaking, but it divides data for a single entity among multiple structures, this feels bad.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
