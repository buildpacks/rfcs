# Meta
[meta]: #meta
- Name: Lifecycle cache contract changes.
- Start Date: 2019-08-02
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Though not formally part of the spec, the project description and the
lifecycle reference implementation contain the following four phases:

- `/lifecycle/restorer` (considered an optional platform step)
- `/lifecycle/analyzer`
- `/lifecycle/exporter`
- `/lifecycle/cacher` (considered an optional platform step)

This proposal seeks to reverse the order of `analyzer` and `restorer`.
It also seeks to combine the `exporter` and `cacher` phases into a single
phase called `exporter`.

# Motivation
[motivation]: #motivation

In the current lifecycle reference implementation, the `restorer` phase
fetches cached layers from a previous cache image. These layers can be
arbitrarily large and, when using a remote repository, can represent a large
amount of overhead. The `analyzer` phase runs after `restorer` and it
may deterine that particular cache layers are no longer valid and remove them
from the rest of the process - however, we've already paid a large cost to
fetch them in the first place.

The determination of cache layer validity can frequently be performed
through the analysis of metadata: comparing metadata from the cache image with
metadata from the previous application image. If we reverse the order of
the `restorer` and `anaylzer` phases, the `analyzer` phase can examine metadata
and pass this information through to the `restorer`, allowing for optimzed
fetching of required layers.

During the `cacher` and `exporter` phases, duplicative work can be avoided
by combining these two phases. For example, a layer that is both
`launch=true` and `cache=true` can be processed once, allowing for better
efficiencies.

# What it is
[what-it-is]: #what-it-is

## Reversed `analyzer` and `restorer` phases, with a formalized spec

The spec will formalize the `analyzer` phase as follows:

### `/lifecycle/analyzer`

| Flag            | Required | Env var            | Default        | Description |
| --------------- | -------- | ------------------ | -------------- | ------------|
| `-group`        | optional | `CNB_GROUP_PATH`   | `./group.toml` | group.toml file |
| `-layers`       | optional | `CNB_LAYERS_DIR`   | `/layers`      | layers directory |
| `-platform`     | optional | `CNB_PLATFORM_DIR` | `/platform`    | platform directory |
| `-image`        | optional | -                  | -              | repository url for existing application image |
| `-cache-volume` | optional | -                  | -              | local directory, may not be used with `-cache-image` |
| `-cache-image`  | optional | -                  | -              | cache image repository, may not be used with `-cache-volume` |

The `analyzer` phase is able to compare metadata from a pre-existing
application `-image` and a pre-existing `-cache` image (both optional) to
determine the best course of action for the subsequent `restorer` phase.
This infomration can be conveyed through files stored in the `-platform`
directory.

The spec will formalize the `restorer` phase as follows:

### `/lifecycle/restorer`

| Flag            | Required | Env var            | Default        | Description |
| --------------- | -------- | ------------------ | -------------- | ------------|
| `-group`        | optional | `CNB_GROUP_PATH`   | `./group.toml` | group.toml file |
| `-layers`       | optional | `CNB_LAYERS_DIR`   | `/layers`      | layers directory |
| `-platform`     | optional | `CNB_PLATFORM_DIR` | `/platform`    | platform directory |
| `-image`        | optional | -                  | -              | repository url for existing application image |
| `-cache-volume` | optional | -                  | -              | local directory, may not be used with `-cache-image` |
| `-cache-image`  | optional | -                  | -              | cache image repository, may not be used with `-cache-volume` |

The `restorer` phase is responsible to make available images and layers from
previous builds to improve the efficiency of the current build. It will
typically use information assembled by the `analyzer` phase to do so.

### Why two phases, and not one?

This proposal envisions a future extension to the spec where the buildpack
itself can be involved in analysis, possible via an optional `/bin/analyze`
hook. This would allow the buildpack to have input into whether or not
particular layers should be made available. For example, a Node.js buildpack
could determine via a hash of a `package-lock.json` file that a given cache
layer is no longer useful and thus need not be made available.

**This document does not propose `/bin/analyze` at this time and it only
mentioning it as justification for two seperate `analyzer` / `restorer`
phases.**


## Combined `exporter` phase.

The spec will formalize the (combined) `exporter` phase like this:

### `/lifecycle/exporter [image1] <image2>...`

| Flag            | Required | Env var            | Default        | Description |
| --------------- | -------- | ------------------ | -------------- | ------------|
| `-group`        | optional | `CNB_GROUP_PATH`   | `./group.toml` | group.toml file |
| `-layers`       | optional | `CNB_LAYERS_DIR`   | `/layers`      | layers directory |
| `-platform`     | optional | `CNB_PLATFORM_DIR` | `/platform`    | platform directory |
| `-run-image`    | optional | `CNB_RUN_IMAGE`    | -              | repository url for the run image to build on top of, if not specifed, must be set by env var |
| `-app`          | optional | `CNB_APP_DIR`      | `/workspace`   | application source directory |
| `-cache-volume` | optional | -                  | -              | local directory, may not be used with `-cache-image` |
| `-cache-image`  | optional | -                  | -              | cache image repository, may not be used with `-cache-volume` |

At least one image name must be provided, and multiple image names can be
provided (all named images will have the same layers).

The `exporter` phase will be responsible for the combined activities of the
previous `exporter` and `cacher` phases
(see https://github.com/buildpack/spec/blob/master/buildpack.md#phase-4-export).

The previous `/lifecycle/cacher` phase will be removed from the spec.

# Drawbacks
[drawbacks]: #drawbacks

Argubly, there is less modularity in this design; for example, if someone only
wanted to swap their caching implementation, this is somewhat more difficult
to do. This can be mitigated through a clear separation of responsibilities
in the lifecycle reference implementation possibly allowing users to provide
an alternate caching implementation via injection in the CLI invocation (i.e.,
in the `restorer` and `exporter` `main()` functions).

# Alternatives
[alternatives]: #alternatives

The primary alternative is to "work around" the spec. For example, the
`/lifecycle/restorer` could simply write down the value of the cache url in
some known location so that the `/lifecycle/analyzer` could read it and a new
implementation of `/lifecycle/analyzer` would be responsible to restore cache
layers. A nasty work-around like this seems to point to a deficiency with the
spec that should be addressed (e.g, by this RFC).

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- The author not familiar enough with the overall spec and the existing
  implementations to know which flags are optional and which are required.
- This RFC suggests cleaning up the flag names, using `-base`, `-cache`, and
  `-image` to more consistency identify the different portions. It also moves
  towards flags, and away from positional args. There may be some reason
  unknown to the author as to why flag names and positional args were used
  in the first place.

