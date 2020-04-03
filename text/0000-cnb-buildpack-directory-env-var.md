# Meta
[meta]: #meta
- Name: CNB\_BUILDPACK\_DIR environment variable
- Start Date: 2020-04-02
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

In order to simplify buildpack implementation for authors, this RFC suggests introducing a new environment variable that is available during detect and build phases that points to the root of the buildpack source.

# Motivation
[motivation]: #motivation

Buildpack implementations sometimes need to refer to files in their source directories for configuration or metadata. When implementing buildpacks in bash, sourcing other scripts happens relative to the current working directory. This requires buildpack authors to implement a way to determine the buildpack directory so the files can be included via absolute paths. This can be tedious and is error-prone.

# What it is
[what-it-is]: #what-it-is

An environment variable that can be used by a buildpack to conveniently refer to the buildpack directory.

One use-case is sourcing other scripts easily:

```
#!/usr/bin/env bash
set -eo pipefail

source "${CNB_BUILDPACK_DIR}/lib/tools.sh"
```

# How it Works
[how-it-works]: #how-it-works

Before calling `bin/detect` and `bin/build`, lifecycle creates an environment variable named `CNB_BUILDPACK_DIR` that contains the absolute path to the buildpack directory.

# Drawbacks
[drawbacks]: #drawbacks

- A new environment variable adds more clutter to the namespace.

# Alternatives
[alternatives]: #alternatives

* The same feature could be implemented by passing the buildpack directory to `bin/detect` and `bin/build` as another argument. We already pass a bunch of arguments to those which would make the situation worse.
* Not doing anything would result in buildpack authors continuing to implement this functionality in their buildpacks.


# Prior Art
[prior-art]: #prior-art

Here's a sample of buildpacks and libraries that implement buildpack directory detection themselves:

* [libbuildpack](https://github.com/buildpacks/libbuildpack/blob/35cf959642b9ebd903d39ba9290eaf57da25c80b/buildpack/buildpack.go#L88-L116)
* [Heroku's nodejs-engine-buildpack](https://github.com/heroku/nodejs-engine-buildpack/blob/b9489c80c3bed6b46491fbee0657eb59a25bb619/bin/detect#L6)
* [Cloud Foundry's java-buildpack](https://github.com/cloudfoundry/java-buildpack/blob/master/bin/compile#L21)


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- None

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
The spec should be changed to make mention of this environement variable. 