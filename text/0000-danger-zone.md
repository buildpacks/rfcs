# Meta
[meta]: #meta
- Name: Read/Write Platform Volume Mount
- Start Date: 2020-06-02
- Author(s): nebhale
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Buildpacks should have access to a read/write file system location provided by the platform.

# Motivation
[motivation]: #motivation

Currently, every part of the filesystem available during `detect` and every part of the filesystem other than layers during `build` are read-only.  This satisifies most use-cases, but specifically does not support the possibility of multiple builds sharing a communal filesystem location.  While this would likely to be a disaster in many situations, especially in production environments, being able to share a filesystem between a development laptop and a build is _very_ useful.  For example, the single longest bit of building a Java application from source is the initial population of a Maven or Gradle cache.  Hundreds and perhaps thousands of artifacts are downlaoded to do the very first build and subsequently never need to be downloaded again.  Caching these artifacts in a `cache = true` layer helps, but doesn't solve the first build speed problem and results in a pretty poor demo experience.  If a user could mount their `~/.m2` or `~/.gradle` folders into a safe location within the build container, accepting the overall risk of such a choice, the experience would be vastly superior.

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define any new terminology.
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
- Explaining the feature largely in terms of examples.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing users and new users.

# How it Works
[how-it-works]: #how-it-works

A folder named `/platform/unsafe` should be reserved by specification.  Within that folder, an arbitrary collection of directories could be mounted (e.g. `/platform/unsafe/{gradle,maven}`).  Each of the mounts at those specified children would be ready/write instead of read only as all other mounts are configured.  Buildpacks have complete access during both `detect` and `build` and no other enforcment is required.

# Drawbacks
[drawbacks]: #drawbacks

* There is an amazing amount of danger in using a shared filessystem in distributed systems.
* Performance problems accessing shared filesystems in distributed systems.
* Performance problems accessing a local filessystem from within the MacOS Docker Daemon.

# Alternatives
[alternatives]: #alternatives

* There don't appear to be any viable strategies for exposing a local filesystem to the build container.
* Not doing this leaves things with the status quo which isn't horrible.

# Prior Art
[prior-art]: #prior-art

Currently, arbitrary read-only volumes can be mounted under `/platform`.  The outcome of this RFC would be similar with looser permissions and more risk.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

* Should the folder actually be called `/platform/danger-zone`?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

* The buildpack specification will need to describe a reserved folder in `/platform` where read/write filesystems can be mounted.
* The platform specification will need to describe how to communicate to the `lifecycle` what folders to mount.
