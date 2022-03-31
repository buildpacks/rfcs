# Meta
[meta]: #meta
- Name: Stop deleting cache images
- Start Date: 2022-03-31
- Author(s): jabrown85
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/lifecycle#803](https://github.com/buildpacks/lifecycle/issues/803)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Lifecycle will no longer try to delete previous cache images when publishing cache images.

# Definitions
[definitions]: #definitions

* Cache Image: The cache stored between builds - stored in a registry.
* ECR: Amazon's container registry product

# Motivation
[motivation]: #motivation

- Why should we do this?
  As discussed in [buildpacks/lifecycle#803](https://github.com/buildpacks/lifecycle/issues/803), some registries (ECR) do not support `DELETE`. For platforms that work exclusively with such registries, the warning output by lifecycle and the time taken to fail is unavoidable and lifecycle is wasting time trying to complete an operation that will never succeed.

- What use cases does it support?
  All platforms that use cache images against registries that do not support delete will no longer see warning messages.

- What is the expected outcome?
  Platforms will need to handle cleanup of their cache images on their own, if they desire.

# What it is
[what-it-is]: #what-it-is

Lifecycle will no longer attempt to delete cache images during cache image export.

# How it Works
[how-it-works]: #how-it-works

Lifecycle will no longer attempt to delete cache images during cache image export.

# Migration
[migration]: #migration

Lifecycle will document this behavior change in Release Notes/Changelog along with the associated Platform API that enables the new behavior.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

Platform authors relying on this behavior will need to take additional measures to ensure cache image cleanup or the destination registry will continue to grow.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  * Add regex or configuration to drive registry hosts to ignore during DELETE  *
  * Stop deleting cache images by default in newer platform API versions, but add a platform-level configuration to enable previous behavior.
- Why is this proposal the best?
  * Lifecycle is not currently cleaning up any other resources
  * Deleting the cache images can hurt reproducibility
  * There are more public registries that don't allow DELETE
- What is the impact of not doing this?
  * End users continue seeing warnings the platform can do nothing about.


# Prior Art
[prior-art]: #prior-art

Discussion at [buildpacks/lifecycle#803](https://github.com/buildpacks/lifecycle/issues/803).
