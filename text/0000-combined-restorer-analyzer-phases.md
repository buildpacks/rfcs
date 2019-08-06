# Meta
[meta]: #meta
- Name: Combined restorer/analyzer and cacher/exporter phases.
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

This proposal seeks to combine `restorer` with `analyzer` (to be named
`restorer`) and `cacher` with `exporter` (to be named `exporter`).

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
metadata from the previous application image. However, this comparison can
only be performed with a combined `restorer` and `analyzer` phase.

A parallel optimization potential exists when combining the `cacher` and
`exporter` phases.

# What it is
[what-it-is]: #what-it-is

## Combined `restorer` phase.

The spec will formalize the (combined) `restorer` phase like this:

```
/lifecycle/restorer \
  -group=[(required) group.toml file] \
  -layers=[(required) layers directory] \
  -image=[(optional) repository url for existing application image] \
  -cache=[(optional) local directory, or repository url for cache image]
```

The `restorer` phase will be responsible for the combined activities of the
previous `restorer` and `analyzer` phases
(see https://github.com/buildpack/spec/blob/master/buildpack.md#phase-2-analysis).

The previous `/lifecycle/analyzer` phase will be removed from the spec.


## Combined `exporter` phase.

The spec will formalize the (combined) `exporter` phase like this:

```
/lifecycle/exporter \
  -app=[(required) the application source directory] \
  -base=[(required) repository url for the base image to build on top of] \
  -group=[(required) group.toml file] \
  -layers=[(required) layers directory] \
  -image=[(required) repository url for new application image] \
  -cache=[(optional) local directory, or repository url for cache image]
```

The `exporter` phase will be responsible for the combined activities of the
previous `exporter` and `cacher` phases
(see https://github.com/buildpack/spec/blob/master/buildpack.md#phase-4-export).

The previous `/lifecycle/cacher` phase will be removed from the spec.

# How it Works
[how-it-works]: #how-it-works

Effectively, we are taking the union of two sets of flags
(i.e., the union of `restorer`/`analyzer` and the union of `exporter`/`cacher`)
and merging the responsibilities into a single lifecycle invocation
(`/lifecycle/restorer` for the former and `/lifecycle/exporter` for the latter).

Combining these phases provides implementers more opportunity to build
better performing solutions, particularly around caching.

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

