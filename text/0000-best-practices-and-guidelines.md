# Meta
[meta]: #meta
- Name: Best practices and guidelines for Cloud Native Buildpacks
- Start Date: 2021-03-29
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

As the CNB (Cloud Native Buildpacks) community grows and more people and organizations adopt it, there is a need for a set of guidelines that augment the CNB `spec` with a set of recommendations on how to design and implement -

* Buildpacks
* Platforms

These guidelines should not in any way be considered a mandate that `buildpack` and `platform` authors and users must follow, though they may find that those that conform well to these guidelines integrate better with the existing CNB ecosystem than those that do not.


# Motivation
[motivation]: #motivation

> **NOTE** : The examples below are theoretical guidelines that are meant to serve as examples and are not meant to be the actual guidelines.

Some of the motivations for the creating a set of guidelines are -

## Better consistency and user experience for users and authors

Examples - 

- A consistent naming scheme for `buildpacks`, `stack` IDs
- A consistent way to "configure" `buildpacks` like specifying environment variables through a project descriptor.
- A consistent format for `Bill-of-materials` metadata section to allow consistent rendering and parsing and easy integration with third-party dependency scanning tools.

## Transfer of knowledge and best pratices accrued over time by experienced users to newer users

Examples - 

- Best practices around layer cache invalidation
- Best practices for a `platform` operator


## Better portability and reusability amongst different CNB ecosystems

Examples - 

- Using `platform` agnostic constructs when writing and distributing `buildpacks`


## Allowing users to write maintainable and efficient `buildpacks` and `platforms`

Examples - 

- Creation of buildpacks that attempt to do one thing and only one thing well and composing them using `meta-buildpacks` (Paketo ideology)

## Avoiding common pitfalls that new users may be unaware of

Examples - 

- `Bill-of-materials` needs to be regenerated on each run


# What it is
[what-it-is]: #what-it-is

The `guidelines` would be contained in a sub-folder of the `buildpacks/docs` repository and it will be maintained by the `Learning team`. The folder should have separate sections that target different personas and list guidelines and best practices specific to them -

- Buildpack users
- Buildpack authors
- Platform operators
- Platform implementors

These could be detailed sections or checklists that they can follow to ensure that they are following the best practices set by the guidelines.

# Drawbacks
[drawbacks]: #drawbacks

## Why should we *not* do this?

More maintenance and support burden on the Learning team.

# Alternatives
[alternatives]: #alternatives

## Create a new repository

The guidelines and best-practices could be a separate repository under the buildpacks organization. This would allow the guidelines and best-practices to have a different review and approval process for the `guidelines`.

## Extend the spec

Have an extension to the spec that contains a list of `SHOULD`s and `MAY`s that capture the guidelines. This may however confuse users and may tie up something like the `spec` which is not geared towards end-users to `guidelines` which are supposed to be.


# Prior Art
[prior-art]: #prior-art

- [Best coding practices](https://en.wikipedia.org/wiki/Best_coding_practices)
- [Rust API guidelines](https://rust-lang.github.io/api-guidelines/about.html)
- [PEP8 - Python Style-guide](https://www.python.org/dev/peps/pep-0008/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- The exact set of guidelines that should be in the first cut of the repository
- Topics and details to cover
- Process for amending and creation of new guidelines
- How to ensure that the `spec` and the `guidelines` so they don't go out of sync with each other