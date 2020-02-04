# Meta
[meta]: #meta
- Name: Source Date Epoch
- Start Date: 2020-01-28
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Allow platforms to define an build epoch. This would improve the UX of images builds at the expense of reproducibility.

# Motivation
[motivation]: #motivation

Currently, the lifecycle sets all build dates to the unix epoch for reproducibility. This can be confusing for newcomers because it looks like their builds are "40 years old". This should at the least be documented. Going one step further, the lifecycle could respect the value of `$SOURCE_DATE_EPOCH` if set by platforms, which would allow an optional override.

# What it is
[what-it-is]: #what-it-is

Lifecycle respects `$SOURCE_DATE_EPOCH` if provided by platform by using that value as the timestamp for everything it creates. This could have a default value of zero for repro. and be set optionally to allow platforms a better UX. eg. `pack build MY_APP --build-epoch 12345` would set `SOURCE_DATE_EPOCH=12345` during build  time and all layers would have that timestamp.

# How it Works
[how-it-works]: #how-it-works

Lifecycle respects `$SOURCE_DATE_EPOCH` if provided by platform by using that value as the timestamp for everything it creates. This could have a default value of zero for repro. and be set optionally to allow platforms a better UX.

# Drawbacks
[drawbacks]: #drawbacks

More knobs to turn, more configurability.

# Alternatives
[alternatives]: #alternatives

- Ignore this
- Set it differently.

# Prior Art
[prior-art]: #prior-art

- Spec: https://reproducible-builds.org/docs/source-date-epoch/

- [`ko`](https://github.com/google/ko/tree/ca1b2a1dedfdb13b4955018631fd6566e5d1a13d#why-are-my-images-all-created-in-1970)
- [`rules_docker`](https://github.com/bazelbuild/rules_docker/blob/371f328c4357e33b64bbdc4eaaf59b4544efa31e/container/image_test.py#L231-L236) (via https://github.com/bazelbuild/bazel/issues/2240)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- We might not need to do this: https://wiki.debian.org/ReproducibleBuilds/StandardEnvironmentVariables#Checklist
