# Meta
[meta]: #meta
- Name: Default ports
- Start Date: 2020-01-22
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Proposes a mechanism whereby a platform can expose a default port for builds.

# Motivation
[motivation]: #motivation

A number of users have complained that the containers they created with CNBs don't run "out of the box" because of an unset `$PORT` variable. This leads to a confusing initial experience and makes the path from running a simple `pack build` to starting a container unnecessarily rocky. If platforms had a default value of `$PORT` they could expose to the lifecycle, which could easily be overridden during a build, it would reduce some of that friction.

# What it is
[what-it-is]: #what-it-is

Platforms that build images with CNB tech create images with a default value for `PORT=8080`. Buildpacks can override that value if it makes sens for their individual case; for example a `postgres` buildpack - if there were such a thing - would override `$PORT` with `5432` which a common convention. In cases where there is no assumed value because the language community hasn't standardized (for example in ruby or nodejs) the images produced by, for example, pack, could still start without the added step of configuring this value during invocation.

# How it Works
[how-it-works]: #how-it-works

The platform spec would dictate that `PORT` must be defined by the platform at the outset of a build, but that buildpacks can override this value.

# Drawbacks
[drawbacks]: #drawbacks

I don't see any downsides to providing a default for this variable, but I'm sure they exist. The only downside would be added complexity of the spec.

# Alternatives
[alternatives]: #alternatives

- Don't do anything. Continue to explain this to users of pack.
- Always set `PORT=1234` because its a cool number.
- Leave this out of the spec and just make the change in `pack`


# Prior Art
[prior-art]: #prior-art

Not sure here?

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Maybe this is the responsibility of buildpacks and platforms should leave this alone. This isn't a problem in the java world (or is it? see https://github.com/buildpacks/rfcs/issues/44#issuecomment-575959243).
