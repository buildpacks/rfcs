# Meta
[meta]: #meta
- Name: `pack` Image Pull Policy
- Start Date: 2020-05-21
- Author(s): @jromero
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

Replace the flag `--no-pull` with `--pull-policy <option>` and default to "IfNotPresent"

# Motivation
[motivation]: #motivation

#### Performance

By not having to check for the latest images on every build we improve performance.

#### Uncommon

The docker CLI, docker compose, and k8s default to similar functionality as described by "IfNotPresent".

# What it is
[what-it-is]: #what-it-is

A new flag `--pull-policy` that takes the following possible options:

- `if-no-present` - only attempt to pull the images if it's not present
- `always` - attempt to always pull images
- `never`- don't attempt to pull images

# How it Works
[how-it-works]: #how-it-works

<!-- This is the technical portion of the RFC, where you explain the design in sufficient detail.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work. -->

### `pack build`

// TODO: Detail all the images used during build and ensure that a single flag/policy makes sense for all images or detail exclusions.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
<!-- Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here. -->
