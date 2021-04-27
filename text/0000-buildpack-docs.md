# Meta
[meta]: #meta
- Name: Buildpack.toml documentation
- Start Date: (fill in today's date: 2021-04-26)
- Author(s): (dwillist)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary
We propose adding a `documentation` file `README.md` adjacent to the `buildpack.toml` file in buildpacks.

We would also like a new OCI label `io.buildpacks.buildpack.docs` in order to attach documentation on the outside of builder images and buildpackages.


# Motivation
[motivation]: #motivation

- Why should we do this?
  - To keep documentation accessible from the pack CLI & other buildpack tooling.
  - Establish common locations for docs & promote similar documentation strategies between buildpacks.

- What is the expected outcome?
    - buildpacks have a standard location for documentation
    - users can more easily figure out how groups of buildpacks work together.

# What it is
[what-it-is]: #what-it-is
Just adding a new optional `README.md` adjacent to the `buildpack.toml` file in buildpacks and a new OCI label `io.buildpacks.buildpack.docs` on buildpackages and builder images.

# How it Works
[how-it-works]: #how-it-works

Just adding the above file & image label would allow for `pack` to add some command exposing documentation when inspecting builders & any buildpack locator.

This documentation could then be easily displayed by `pack inspect ...` commands as well as used to add some more content to the registry.


# Drawbacks
[drawbacks]: #drawbacks

- Polluting the image labels.

Really would be nice to have a single documentation solution for folks that already have nice HTML docs see the [paketo project](https://paketo.io/docs/buildpacks/language-family-buildpacks/go/)

# Alternatives
[alternatives]: #alternatives

Could add documentation directly into the `buildpack.toml` file under a `documentation` key.

Could ditch all documentation at the command line level & just add documentation to the registry when running pack register.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
    - New files added to buildpacks & new labels added to buildpacks & builder images.
- What parts of the design do you expect to be resolved through implementation of the feature?


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
- New `builpack.toml` field.

