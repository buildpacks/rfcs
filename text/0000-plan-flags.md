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

## State of Paketo Buildpacks
- The current method that the Paketo Buildpacks uses to communicate information to an earlier buildpack is to set an arbitrary string field in the Build Plan (TOML) `requires.metadata` section.
- Putting this information in the `requires.metadata` obfuscates the flow of information between buildpacks.
- This implicit contract between dependent buildpacks should be formalized.

### Example:
 We consider the interactions between the Paketo `node-engine` and `npm`:

 - The `node-engine` provides the `node` dependency to an image, but only for the `launch` phase.
 - The `npm` requires `npm` during the `build` phase, and so it adds an entry in `requires.metadata` to reflect this need, it may also require a version of `node-engine` so it may `require` a version of `node-engine`.
 - As a result during the `node-engine`'s build phase all `entries.metadata` must be parsed for `build`, `launch`, and `version` to determine the correct flags to attach to the `npm` dependency Layer Metadata.

## Goal
1. Simplify the Build Plan (TOML) and Buildpack Plan (TOML) formats.
2. Clarify and codify how buildpacks communicate with each other.
3. Leverage the lifecycle to implement task that would simplify the buildpack authoring process.


# What it is
[what-it-is]: #what-it-is

## Build Plan (TOML) Changes
We propose a complete restructuring of the `requires` field and an addition to the `provides` field in the Build Plan (TOML) file.

We propose the following Build Plan (TOML):

```toml
[[provides]]
name = "<dependency name>"
[provides.strategy.version]
  collect = false

[[requires]]
name = "<dependency name>"
[requires.version]
  constraint = "<dependency constraint>"
  source = "<dependency constraint source>"
[requires.capabilities]
  # arbitary key to bools
  build = false
  launch = false
[requires.modifiers]
  # arbitrary keys and values
  some-modifer = "modifier"

[[or]]

[[or.provides]]
name = "<dependency name>"
[provides.strategy.version]
  collect = false

[[or.requires]]
name = "<dependency name>"
[requires.version]
  constraint = "<other dependency constraint>"
  source = "<other dependency constraint source>"
[requires.capabilities]
  # arbitary key to bools
  build = false
  launch = false
[requires.modifiers]
  # arbitrary keys and values
  some-other-modifer = "other modifier"
```

This proposal adds a new field to `provides`:
- `provides.strategy.version` field holds a `collect` key which indicates if the version fields from all of the requires should be merged together or if they should collected into an array.
  - This field is structured to be extensible to other fields in `requires`.

This proposal also removes both the `requires.version` and `requires.metadata` fields and replaces them with three new fields each with their own purpose:
- `requires.version` field holds all of the version requirement information.
  - `constraint` can be any semver constraint used to decide which dependency the providing buildpack will install.
  - `source` is the origin of the constraint (i.e. it came from `package.json`).
- `requires.capabilities` holds the `build` and `launch` keys and indicate when during which phase buildpack specific data and dependencies are available.
- `requires.modifiers` is meant to hold only specific and **unique** buildpack communications.


## Buildpack Plan (TOML) changes
For the same reasons, we would like to add the `version`, `capabilities`, and `modifiers` fields to the Buildpack Plan, along with a `versions` field and some additional format changes:

```toml
[[entries]]
name = "<dependency name>"
[entries.version]
  constraint = "<dependency constraint>"
[entries.capabilities]
  # or merged bool values from arbitray keys
  build = false
  launch = false
[entries.modifiers]
  # last-in-wins merged values from arbitrary keys
  some-modifer = "modifier"
[[entries.collection]]
[entries.collection.version]
  constraint = "<dependency constraint>"
  source = "<dependency constraint source>"
```
In each entry the `name` field is **unique**.

We arrived at this format for several reasons:
- Moves some common buildpack operations into the lifecycle.
  - Collects all  of the data from various `requires` entries into a unique entry for a given dependency.
  - Allows for the implementation of information merging strategies for the `version`, `capabilities`, and `modifiers`.
    - All version constraints are merged together into the `version` field.
      - If the merge would result in a valid semver constraint, then image build will continue.
      - If the merge fails to produce a valid semver constraint (i.e. a constraint the is unreachable such as "1.10.\*, 1.12.\*"), then it would cause the image build to fail.
    - All `capabilities.build` and `capabilities.launch` for a given dependency will be `or` merged together.
    - All keys in `modifiers` will be merged with a last in wins strategy.
- The `collection` list will only contain elements if the `provides` strategy was set to a `collect = true`.
  - If the `collection` field is present the `version` field will be empty.
  - The `collection` field has been structured to be extensible to other fields in `requires`, this will allow for the extension of `provides.strategy`.

# How it Works
[how-it-works]: #how-it-works

The proposed changes in this solution to the Buildpack Plan (TOML) would require the following changes to the lifecycle to generate data in the format defined above:

- Build Plan entries are aggregated based on dependency names
- The `capabilities` and `modifiers` fields are merged together using their assigned merge strategies.
- The `version` fields are either merged together or collected based on the **providers** merge strategy.
- If at any point during this merge process there is a failure, then the image build will fail.
- In the case that the merge failure occurs while merging the version together, the lifecycle will print out the source of the constraint that caused the merge to fail.

## Merging Example
The following are examples the Build Plan (TOML) and the Buildpack Plan (TOML) for when the lifecycle merges them together:

### Build Plan (TOML)
```toml
[[provides]]
name = "node"
[provides.strategy.version]
  collect = false

[[requires]]
name = "node"
[requires.version]
	constraint = "10.19.1"
	source = "buildpack.yml"
[requires.capabilities]
	build = false
	launch = true
[requires.modifiers]
	special-edition = "yes"

[[requires]]
name = "node"
[requires.version]
	constraint = "~10"
	source = "package.json"
[requires.capabilities]
	build = true
	launch = true
[requires.modifiers]
	special-edition = "no"
```

### Buildpack Plan (TOML)
```toml
[[entries]]
name = "node"
[entries.version]
	constraint = "~10, 10.19.1"
[entries.capabilities]
	build = true
	launch = true
[entries.modifiers]
	special-edition = "no"
```

## Non-merging Example
The following is an example of the Build Plan (TOML) and the Buildpack Plan (TOML) when the lifecycle does not merge them together as per the `provides.strategy` setting:

### Build Plan (TOML)
```toml
[[provides]]
name = "node"
[provides.strategy.version]
  collect = true

[[requires]]
name = "node"
[requires.version]
	constraint = "10.19.1"
	source = "buildpack.yml"
[requires.capabilities]
	build = false
	launch = true
[requires.modifiers]
	special-edition = "yes"

[[requires]]
name = "node"
[requires.version]
	constraint = "~10"
	source = "package.json"
[requires.capabilities]
	build = true
	launch = true
[requires.modifiers]
	special-edition = "no"
```

### Buildpack Plan (TOML)
```toml
[[entries]]
name = "node"
[entries.capabilities]
	build = true
	launch = true
[entries.modifiers]
	special-edition = "no"
[[entries.collection]]
[entries.collection.version]
	constraint = "10.19.1"
	source = "buildpack.yml"
[[entries.collection]]
[entries.collection.versions]
	constraint = "~10"
	source = "package.json"
```

# Drawbacks
[drawbacks]: #drawbacks

- This would be a breaking change for consumers of the Build Plan and Buildpack Plan.
- Increased functionality of the lifecycle, which increases maintenance costs of the lifecycle as a whole.
- Removes the functionality to communicate non-unique information across buildpacks as the `modifiers` field is always merged. This could be mitigated by adding non-merge capabilities to the `modifiers` field.

# Alternatives
[alternatives]: #alternatives

- Stick with current implementation but make it complete generic (i.e. remove top level version flag) this would make the requires a completely blank canvas and the lifecycle perform no new actions.

# Prior Art:
[prior-art]: #prior-art

- The name for of the `capabilities` field comes from Seleniums `DesiredCapabilities` which can be seen [here](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should we have collection strategies for all `requires` fields out of the gate or just add to fields when necessary?
