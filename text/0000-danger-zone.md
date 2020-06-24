# Meta
[meta]: #meta
- Name: Read-Write Volume Mount in Pack
- Start Date: 2020-06-02
- Author(s): nebhale
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The `pack` CLI should expand its volume mounting functionality to allow arbitrary read-write mounting.

# Motivation
[motivation]: #motivation

Currently, every part of the filesystem available during `detect` and every part of the filesystem other than layers during `build` are read-only.  This satisfies most use-cases, but specifically does not support the possibility of multiple builds sharing a communal filesystem location.  While this would likely to be a disaster in many situations, especially in production environments, being able to share a filesystem between a development laptop and a build is _very_ useful.  For example, the single longest bit of building a Java application from source is the initial population of a Maven or Gradle cache.  Hundreds and perhaps thousands of artifacts are downloaded to do the very first build and subsequently never need to be downloaded again.  Caching these artifacts in a `cache = true` layer helps, but doesn't solve the first build speed problem and results in a pretty poor demo experience.  If a user could mount their `~/.m2` or `~/.gradle` folders into the build container, accepting the overall risk of such a choice, the experience would be vastly superior.

This benefit is generally useful and extends beyond build caches to nearly every aspect of buildpack usage including development of both buildpacks and the lifecycle.

# What it is
[what-it-is]: #what-it-is

Currently, the `pack` CLI has a `--volume` flag that allows users to expose a local filesystem location as a read-only volume mount into the `/platform` directory.  This change should generalize that flag and allow it to mount a local filesystem location as a read-write volume mount into any location within the build container.  If a user chooses to mount at any specification-reserved files system location (e.g. `/cnb` or `/layers`), a warning should be displayed.

# How it Works
[how-it-works]: #how-it-works

The technical details are opaque and implementation dependent as this is a change to the behavior of a `pack`-specific flag.

# Drawbacks
[drawbacks]: #drawbacks

* There is an amazing amount of danger in using a shared filesystem in distributed systems.
* Performance problems accessing shared filesystems in distributed systems.
* Performance problems accessing a local filesystem from within the MacOS Docker Daemon.

# Alternatives
[alternatives]: #alternatives

* There don't appear to be any viable strategies for exposing a local filesystem to the build container.
* Not doing this leaves things with the status quo which isn't horrible.

# Prior Art
[prior-art]: #prior-art

* Currently, arbitrary read-only volumes can be mounted under `/platform`.  The outcome of this RFC would be similar with looser permissions and more risk.
* The `docker run` command presents a good model, both in behavior and syntax for the analogous `pack` CLI `--volume` flag.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

* Should certain CNB-reserved folders be mountable?  I believe that preventing mounts at their locations restricts the upside to this feature, without adding a significant amount of safety.  The overall feature is quite dangerous and special-casing two folders isn't going to change that significantly.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This is a `pack`-specific feature, so no specification will need to be changed.
