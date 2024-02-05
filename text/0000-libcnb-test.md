# Meta
[meta]: #meta
- Name: Testing Library for libcnb
- Start Date: 2022-02-25
- Author(s): samj1912
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes the creation of a new repository under the buildpacks organization for providing test utilities for images created by buildpacks. This repository will be maintained by the Buildpack Author's Tooling team.

# Definitions
[definitions]: #definitions

- libcnb: Go bindings for Cloud Native Buildpacks

# Motivation
[motivation]: #motivation

- Why should we do this?

As the project is starting to own actual utiltity buildpacks, we would need an appropriate testing library for integration testing our buildpacks.

- What use cases does it support?

The library should allow for the following -
- Allow programitcally building images based off buildpacks
  - Checking which buildpacks were detected
  - Checking for the rebuild logic
- Allow testing the output containers and its properties including -
  - Files and their contents
  - Environment variables including those set by the launcher
  - SBOM contents
  - Executing commands in the output container and asserting their outputs


- What is the expected outcome?

A go library or ideally a CLI tool that allows for integration testing of buildpack based container images, idealling through a declarative API to describe the test scenarios. The go library can be used directly by go based buildpacks testing repository and the CLI tool could allow for generic testing of buildpack logic regardless of the language the buildpack was implemented in.

# What it is
[what-it-is]: #what-it-is

A set of golang utilties and helper functions to interact with `pack`, `docker` and output `container`s generated through the build process. Additionally we can also provide a standalone binary similar to [container-structure-test](https://github.com/GoogleContainerTools/container-structure-test) that allows for declarative testing of containers built by buildpacks.

# How it Works
[how-it-works]: #how-it-works

We could take inspiration from the following tools - 

- [occam](https://github.com/paketo-buildpacks/occam) - Paketo's integration testing library
- [testcontainers-go](https://golang.testcontainers.org/) - Testcontainers-Go is a Go package that makes it simple to create and clean up container-based dependencies for automated integration/smoke tests. The clean, easy-to-use API enables developers to programmatically define containers that should be run as part of a test and clean up those resources when the test is done.
- [container-structure-test](https://github.com/GoogleContainerTools/container-structure-test) - The Container Structure Tests provide a powerful framework to validate the structure of a container image. These tests can be used to check the output of commands in an image, as well as verify metadata and contents of the filesystem.

# Migration
[migration]: #migration

None

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

More maintanence burden for the BAT team.

# Alternatives
[alternatives]: #alternatives

Use one of the above existing libraries.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Exact design and interface for the library
- Adding support for the CLI or not

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

None
