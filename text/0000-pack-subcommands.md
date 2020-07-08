# Meta
[meta]: #meta
- Name: `pack` subcommands
- Start Date: 2020-07-08
- Author(s): @jromero
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

Update the `pack` CLI to use more common subcommand patterns.

# Motivation
[motivation]: #motivation

As the number of subcommands for `pack` grow, it's becoming more difficult to identify interworking subcommands at first glance. See the current list of subcommands below.

```
pack

  build                 Generate app image from source code
  rebase                Rebase app image with latest run image
  inspect-image         Show information about a built image
  set-run-image-mirrors Set mirrors to other repositories for a given run image
  set-default-builder   Set default builder used by other commands
  inspect-builder       Show information about a builder
  suggest-builders      Display list of recommended builders
  trust-builder         Trust builder
  untrust-builder       Stop trusting builder
  list-trusted-builders List Trusted Builders
  create-builder        Create builder image
  package-buildpack     Package buildpack in OCI format.
  suggest-stacks        Display list of recommended stacks
  version               Show current 'pack' version
  report                Display useful information for reporting an issue
  completion            Outputs completion script location
  help                  Help about any command
```

# What it is
[what-it-is]: #what-it-is


### Proposed structure

```
pack

  app
    build
    inspect
    rebase
  builder
    create
    inspect
    suggest
  buildpacks
    package
    register
  completion
  config
    default-builder
      set
      unset
      show
    run-image-mirror
      add
      remove
      list
    registry
      add
      remove
      list
    trusted-builder
      add
      remove
      list
  help
  report
  stacks
    suggest
  version
```

### Top-Level Aliases

There would also be some alias subcommands for the `app` set of subcommands for easier usage and compatibility.

* `pack build` -> `pack app build`
* `pack inspect` -> `pack app inspect`
* `pack rebase` -> `pack app rebase`

### Config

The `config` subcommand would work with the notion of two different type of resources:

##### Singular

Singular resources would have the following subcommands:

* set
* unset
* show (aliased to subcommand root)

###### Example

```
# sets the default builder
pack config default-builder set gcr.io/my-org/my-builder:latest

# unset the default builder
pack config default-builder unset

# show the default builder
pack config default-builder show

# show the default builder (w/o subcommand)
pack config default-builder
```

##### List

List resources would have the following subcommands:

* add
* remove
* list

The explicit additional parameters would be based on the specific implementation needs.

###### Example

```
# adds `gcr.io/my-org/my-image` as a mirror for `my-image`  
pack config run-image-mirrors add my-image gcr.io/my-org/my-image

# removes `gcr.io/my-org/my-image` as a mirror for `my-image`
pack config run-image-mirrors remove my-image gcr.io/my-org/my-image

# removes all mirrors for `my-image`
pack config run-image-mirrors remove my-image

# list all mirrors
pack config run-image-mirrors list

# list all mirrors for `my-image`
pack config run-image-mirrors list my-image
```

# How it Works
[how-it-works]: #how-it-works


## Backwards Compatibility

1. There would be a period in which all pre-existing subcommands would work.
2. [Top-level aliases](#top-level-aliases) will provide continued compatibility for common operations.

# Drawbacks
[drawbacks]: #drawbacks

- Change is bad... mkay.

# Alternatives
[alternatives]: #alternatives

- Keep it as it is.
- Some [Config](#config) subcommands could be more intertwined with their respective resource. For example, `pack builder trust ...` instead of `pack config trust-builder ...`.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Are there better alternatives to the name "app"?

# Spec. Changes
[spec-changes]: #spec-changes

None
