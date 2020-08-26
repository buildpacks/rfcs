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

The pack commands will be reorganized in a way where they are grouped by resource type where possible. Additionally, a new
command `config` will group subcommands that solely operate on mutating the config file.


An overview of the (sub)commands:

```
pack

  build
  builder
    create
    inspect
    suggest
  buildpack
    package
    register
  completion
  config
    default-builder
      set
      unset
      get
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
  inspect
  report
  rebase
  stack
    suggest
  version
```

### Config

The `config` subcommand would work with the notion of two different type of resources:

##### Singular

Singular resources would have the following subcommands:

* set
* (implied get)

###### Example

```
# sets the default builder
pack config default-builder gcr.io/my-org/my-builder:latest

# unset the default builder
pack config default-builder --unset

# gets the default builder
pack config default-builder
```

##### List

List resources would have the following subcommands:

* add
* remove
* list
* (implied list)

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

# list all mirrors (implied list)
pack config run-image-mirrors

# list all mirrors for `my-image`
pack config run-image-mirrors list my-image
```

# How it Works
[how-it-works]: #how-it-works


## Backwards Compatibility

1. There would be a period in which all pre-existing subcommands would work (with a deprecation warning).
2. Critical operations (`build`, `rebase`) will remain unchanged.

# Drawbacks
[drawbacks]: #drawbacks

- Change is bad... mkay.

# Alternatives
[alternatives]: #alternatives

### Colon separated commands

> We could use a `pack <topic>:<command>` pattern instead of space separated.

Some examples:

**Single config resource:**

```shell
# set
pack config:default-builder gcr.io/my-org/my-builder:latest

# unset
pack config:default-builder:unset

# get
pack config:default-builder:get

# get (implied)
pack config:default-builder
```

**List config resource:**

```shell
# adds `gcr.io/my-org/my-image` as a mirror for `my-image`  
pack config:run-image-mirrors:add my-image gcr.io/my-org/my-image

# removes `gcr.io/my-org/my-image` as a mirror for `my-image`
pack config:run-image-mirrors:remove my-image gcr.io/my-org/my-image

# removes all mirrors for `my-image`
pack config:run-image-mirrors:remove my-image

# list all mirrors (implied)
pack config:run-image-mirrors

# list all mirrors
pack config:run-image-mirrors:list

# list all mirrors for `my-image`
pack config:run-image-mirrors:list my-image
```

### Alternative Utility

> Another alternative is to focus "pack" more for specific audiences which would reduce the number of commands that it would have to know.

```
pack

  build
  config
     ...
  inspect
  run
```

The alternative utility CLI would be everything else:

```
bputils

  builder
    create
    inspect
    suggest
  buildpack
    create
    package
    register
  stack
    suggest
```

### Config alternatives

- Only allow manual edits of config file.
    - A `config` command would allow providing `help` for possible operations and argument values.
- Some [Config](#config) subcommands could be more intertwined with their respective resource. For example, `pack builder trust ...` instead of `pack config trust-builder ...`.
    - Other commands are operations on the resource whereas having `config` subcommands would make it more obvious that
    `pack` is solely mutating local configuration.

### App / Project / Image images commands

- Instead of having top-level commands `build`, `inspect`, `rebase` they can be associated with an `app`/`project`/`image` resource.
    - There would also be some alias subcommands for the `app` set of subcommands for easier usage and compatibility.
        - `pack build` -> `pack app build`
        - `pack inspect` -> `pack app inspect`
        - `pack rebase` -> `pack app rebase`
    - The consensus appears to be NOT to provide a resource name based on the confusion it can impose depending on usage.
        - A few examples: "Is a function image an _app_?", "A _project_ may be composed of multiple images, am I operating on a single or multiple images?", "What type of _image_ am I building?".

# Prior Art
[prior-art]: #prior-art

* colon (`:`) command delimiters
    * https://oclif.io/
* nested subcommands
    * http://docopt.org/
    * https://picocli.info/#_nested_sub_subcommands
    * https://oclif.io/
    * kubectl
* config
    * https://git-scm.com/docs/git-config
    * https://cloud.google.com/sdk/gcloud/reference/config

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

None

# Spec. Changes
[spec-changes]: #spec-changes

None
