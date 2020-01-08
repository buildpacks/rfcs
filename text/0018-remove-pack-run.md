# Meta
[meta]: #meta
- Name: Remove `pack run`
- Start Date: 2019-12-11
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Remove `run` command from the pack CLI

# Motivation
[motivation]: #motivation

Built images can already be run with `docker` or with a container orchestrator like Kubernetes.
`pack run` does not expose many of the runtime options users desire.
 Users may initially assume that `pack run` is analogous to `docker run` and be surprised to discover that it rebuilds the image.
 For these reasons `pack run` adds maintenance burden without significant value.

# What it is
[what-it-is]: #what-it-is

Delete `run` command from `pack`

# Drawbacks
[drawbacks]: #drawbacks

It was originally intended to support rapid build/run cycles during development, some users may find it useful for this reason.

# Alternatives
[alternatives]: #alternatives

- Keep `pack run` the way it is
- Invest in building out a better `pack run` experience

# Prior Art
[prior-art]: #prior-art

Other tools like `docker` do not provide a single command for build+run

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Do current users use the `pack run` command?