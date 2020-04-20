# Meta
[meta]: #meta
- Name: Buildplan & Buildpack Plan Flags
- Start Date: 2020-03-06
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

The `metadata` field that is part of require should be removed and replaced with fields that have defined purpose to standardize inter-buildpack communication.

# Motivation
[motivation]: #motivation
The overarching goal of this RFC is to 

1) Simplifies buildpack implementation and the  Build Plan (TOML) and Buildpack Plan (TOML) formats.

2) Clarify how buildpacks communicate with each other.

3) Leverage the lifecycle to implement steps that would simplify the buildpack authoring process.

State of Cloudfoundry Buildpacks:

- The current method that the Paketo Buildpacks uses to communicate information to an earlier buildpack is to set an arbitrary string field in the Build Plan (TOML) `requires.metadata` section.
- Putting this information in the `requires.metadata` obfuscates the flow of information between buildpacks.  
- This implicit contract between dependent buildpacks should be formalized.

#### Example:
 We consider the interactions between the Paketo `node-engine` and `npm`
 
 - The `node-engine` provides the `npm` dependency to an image, but only for the `launch` phase.
 - The `npm` requires `npm` during the `build` phase, and so it adds an entry in `requires.metadata` to reflect this need, it may also require a version of `node-engine` so it may `require` a version of `node-engine`.
 - As a result during the `node-engine`'s build phase all `entries.metadata` must be parsed for `build`, `launch`, and `version` to determine the correct flags to attach to the `npm` dependency Layer Metadata.
  
# What it is
[what-it-is]: #what-it-is

## Build Plan (TOML) Changes
  
We propose a complete restructuring of the `requires` field and an addition to the `provides` field in the Build Plan (TOML) file. 
  
  We propose the following Build Plan (TOML):
  
  ```toml
  [[provides]]
  name = "<dependency name>"
  strategy = "<merging strategy>"
  
  [[requires]]
  name = "<dependency name>"
  [requires.version]
    constraint = "<dependency constraint>"
    source = "<dependency constraint source>"
  [requires.capabilities]
    build = false
    launch = false
  [requires.modifiers]
    some-modifer = "modifier"
  
  [[or]]
  
  [[or.provides]]
  name = "<dependency name>"
  strategy = "<merging strategy>"
  
  [[or.requires]]
  name = "<dependency name>"
  [requires.version]
    constraint = "<other dependency constraint>"
    source = "<other dependency constraint source>"
  [requires.capabilities]
    build = false
    launch = false
  [requires.modifiers]
    some-other-modifer = "other modifier"
  ```

This proposal removes both the `version` and `metadata` fields and replaces them with three new fields each with their own purpose.
The `requires.version` field holds all of the version requirement information, this includes a `constraint` which can be any semver constraint
to be used when deciding what dependency the providing buildpack should install and the `source` so that the origin of the constraint can be identified
this will be important when discussing the merging done by the lifecycle later. `requires.capablities` hold the `build` and `launch` keys and indicate
when during which phase buildpack specific data and dependencies are available. Finally, there is `requires.modifiers` this is meant to hold only specific
and unique buildpack communications.
  
## Buildpack Plan (TOML) changes
  
  For the same reasons, we would like to add the `version`, `capabilities`, and `modifiers` fields to the Buildpack Plan, along with a `versions` field and
  some additional format changes: 

  ```toml
  [[entries]]
  name = "<dependency name>"
  [entries.version]
    constraint = "<dependency constraint>"
  [entries.capabilities]
    build = false
    launch = false
  [entries.modifiers]
    # arbitrary keys and values
  [[entries.versions]]
    constraint = “<dependency constraint>”
    source = "<dependency constraint source>"
  ```
In each entry the `name` field is **unique**.

  We arrived at this format for several reasons:
  
  - It allows us to offload some common field merging operations to the lifecycle. We suggest that `version` is merged together if the merge would result in
  a valid semver constraint. If the merge fails to produce a valid semver constraint it would cause the image build to fail.
  We suggest letting all `capabilities.build` and `capabilities.launch` under a single key be merged together (recommending the `or` operator).
  We suggest that keys in `modifiers` be merged with a last in wins strategy.
  - The `versions` list will only contain elements if the `provides` strategy was set to a strategy that does not automatically merge the version constraints together. 
  - A buildpack only needs to handle logic based on `name` keys it is responsible for. 
 
# How it Works
[how-it-works]: #how-it-works

The proposed changes in this solution to the Buildpack Plan (TOML) would require the following changes to the lifecycle to 
generate data in the format defined above:

- Detection Succeeds
- Build Plan entries are aggregated based on dependency-names and the fields are merged together using their respective strategies or are collected
is the providers strategy dictates versions should be collected. If at any point during this merge process there is a failure, then the image build will fail.
In the case that the merge failure occurs while merging the version together, the lifecycle will print out that there was a failure merging the versions and 
then print the source of the constraint that caused the merge to fail.
- Each dependency has an array for all versions and map for metadata that appeared under that dependency name in the Build Plan

#### Example:
The following are examples the Build Plan (TOML) and the Buildpack Plan (TOML) for when the lifecyle merges them together: 

Build Plan (TOML)
```toml
[[provides]]
name = "node"
strategy = “merged versions”

[[requires]]
name = "node"
[requires.version]
	constraint = "10.19.1"
	source = "buildpack.yml"
[requires.capabilities]
	build = false
	launch = true
[requires.modifiers]
	special-edition = true

[[requires]]
name = "node"
[requires.version]
	constraint = "~10"
	source = "package.json"
[requires.capabilities]
	build = true
	launch = true
[requires.modifiers]
	special-edition = false
```

Buildpack Plan (TOML)
```toml
[[entries]]
name = "node"
[entries.version]
	constraint = "10.19.1"
[entries.capabilities]
	build = true
	launch = true
[entries.modifiers]
	special-edition = false
```

The following are examples the Build Plan (TOML) and the Buildpack Plan (TOML) for when the lifecyle does not merge them together as per the `provides.strategy` setting: 


Build Plan (TOML)
```toml
[[provides]]
name = "node"
strategy = “unmerged versions”

[[requires]]
name = "node"
[requires.version]
	constraint = "10.19.1"
	source = "buildpack.yml"
[requires.capabilities]
	build = false
	launch = true
[requires.modifiers]
	special-edition = true

[[requires]]
name = "node"
[requires.version]
	constraint = "~10"
	source = "package.json"
[requires.capabilities]
	build = true
	launch = true
[requires.modifiers]
	special-edition = false
```

Buildpack Plan (TOML)
```toml
[[entries]]
name = "node"
[[entries.versions]]
	constraint = "10.19.1"
	source = "buildpack.yml"
[[entries.versions]]
	constraint = "~10"
	source = "package.json"
[entries.capabilities]
	build = true
	launch = true
[entries.modifiers]
	special-edition = false
``` 

# Drawbacks
[drawbacks]: #drawbacks
     
- This would be a breaking change for consumers of the Build Plan and Buildpack Plan. 
- Increased functionality of the lifecycle, which increases maintenance costs of the lifecycle as a whole.
- Removes the functionality to communicate non-unique information across buildpacks as the `modifiers` field is always merged.

# Alternatives
[alternatives]: #alternatives
- Stick with current implementation but make it complete generic (i.e. remove top level version flag) this would make the requires a completely
blank canvas and the lifecyle perform no new actions.

# Prior Art:
[prior-art]: #prior-art
The name for of the `capabilities` field some from 

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Is there a better data format for the Buildpack Plan?
- Should we allow for more than the version data to stay unmerged?
- What should the merged and unmerged strategies be called?

