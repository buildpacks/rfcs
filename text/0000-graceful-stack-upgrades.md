# Meta

[meta]: #meta

- Name: Graceful stack upgrades
- Start Date: 2022-07-12
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary

[summary]: #summary

This RFC proposes that the lifecycle skip layer re-use and clear its cache when it recognizes that the previous image
was built with a different stack ID.

# Definitions

[definitions]: #definitions

**lifecycle** - software that orchestrates a CNB build; it executes in a series of phases that each have a distinct
responsibility.

**layer re-use** - the lifecycle provides metadata about previously-built layers to buildpacks so that layers can be
re-used if necessary - i.e., the lifecycle can avoid re-uploading unchanged layers to the registry and / or daemon. Only
metadata about layers is copied from the previous image (not data).

**cache** - layers that are not exported but may be needed again at build-time are saved in the cache.

# Motivation

[motivation]: #motivation

Re-using layers that were built with a different underlying OS is unsafe. The layers may depend on OS-level dependencies
that are not present in the new OS, causing errors that can only be seen at runtime. With Ubuntu 18.04 LTS (Bionic
Beaver) [exiting the free initial five-year maintenance period](https://ubuntu.com/about/release-cycle) in April 2023,
other Ubuntu versions - such as 20.04 LTS (Focal Fossa) and 22.04 LTS (Jammy Jellyfish) will become more prevalent in
the CNB ecosystem. Accordingly, the risk is greater that some CNB-built images could break.

Use case: as a platform operator, I want to be able to upgrade my stack without worrying that my images will break.

# How it Works

[how-it-works]: #how-it-works

* The lifecycle needs to know the "previous" stack ID as well as the "current" stack ID to know if they are different.
  The previous stack ID can be read from the previous image, whereas the current stack ID can be read from the run
  image.
    * The current stack ID could also be read from `CNB_STACK_ID` in the lifecycle's execution environment, but this is
      not guaranteed to be set if the lifecycle is running in a lifecycle image (versus a trusted builder).
* The `analyzer` has access to both the previous image and the run image. It will read the value of
  the `io.buildpacks.stack.id` label for each image and compare them - if they are different, it will skip writing
  previous image metadata for `launch=true` layers in analyzed.toml. It will also write the run image stack ID in
  analyzed.toml so that the `restorer` can access it (the `restorer` does not have daemon access currently and therefore
  cannot read the run image when exporting to a daemon).
    * If the run image is switched as an output of image extensions during the detect/generate phase,
      the `io.buildpacks.stack.id` label would need to be re-read prior to cache restoration (by either the extender or
      the restorer). This should probably be out of scope for this RFC since image extensions / Dockerfiles are
      considered experimental.
* The `restorer` will read the run image stack ID from analyzed.toml and compare it to the stack ID in the cache
  metadata (more on that later), and skip copying layer contents from the cache if the stack has changed.
* During the `build` phase, seeing no metadata for `launch=true` layers, buildpacks will act as if there is no previous
  image - i.e., they will create layer contents if necessary. Buildpacks will also find no data for previously cached
  layers.
* The `exporter` currently writes cache metadata as an `io.buildpacks.lifecycle.cache.metadata` label on the cache
  image (or an equivalent file, for a cache volume). The cache metadata can be expanded to include the run image stack
  ID from analyzed.toml.

Some buildpacks may already be recording information about the stack used to create layers in layer metadata. These
buildpacks may be okay with having layer metadata and/or cache contents restored when the stack changes, because they
already have the appropriate logic in place to determine when a layer is safe to re-use. We could introduce a
new `buildpack.force-restore` field in buildpack.toml that when `true` would cause the lifecycle ignore a stack ID
change for that buildpack. If a buildpack is on an older api that doesn't support this field, the lifecycle will do the
safe thing and skip layer restoration. This may entail adding a `-buildpacks` flag to the restorer (so that it can
read each buildpack's descriptor).

# Migration

[migration]: #migration

* platform developers: should ensure `io.buildpacks.stack.id` is present on the run image and `CNB_STACK_ID` is set on
  the build image
* buildpack developers: no change
* buildpack users: must endure one slow rebuild per-image when the stack changes
* consumers of buildpack images: no change (though hopefully spared broken images)

# Drawbacks

[drawbacks]: #drawbacks

Why should we *not* do this?

* This proposal results in a one-time penalty per-image of a slow rebuild due to busting the cache. However, sometimes
  it is safe to re-use layers across stacks. Not all users may appreciate this behavior.
* If either of `io.buildpacks.stack.id` or `CNB_STACK_ID` is unset, this effectively disables caching.

# Alternatives

[alternatives]: #alternatives

- What other designs have been considered?
    * Doing nothing.
    * Allowing buildpacks to express whether a layer is safe to re-use across stacks. However, this is one more thing
      for buildpack authors to think about, and may be hard to get right.
    * Putting the onus on platforms to inspect the previous image and pass `-skip-restore` (or the equivalent) to the
      lifecycle when the stack changes. However, it may be more convenient to implement this at the lifecycle level.
    * Instead of writing the run image stack ID in analyzed.toml, give the restorer daemon access so that it can read
      the `io.buildpacks.stack.id` label itself.
- Why is this proposal the best?
    * Consolidates logic that could be spread across buildpacks and/or platforms in the lifecycle.
- What is the impact of not doing this?
    * Potentially, broken images.

# Prior Art

[prior-art]: #prior-art

Discuss prior art, both the good and bad.

* [TBD] Not sure what to cite here, feedback welcome.

# Unresolved Questions

[unresolved-questions]: #unresolved-questions

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of
  the solution that comes out of this RFC?
    * When we
      implement [RFC to remove stacks](https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md)
      the check using stack ID can be expanded to look at OS, architecture, architecture variant, distribution, and
      version. However, that should be considered out of scope for this RFC.

# Spec. Changes (OPTIONAL)

[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage
label, etc. This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are
necessary, they should be documented here.

Platform:
* Add run image stack ID to analyzed.toml
* Add `-buildpacks` flag to `restorer` (platforms would also need to mount the buildpacks directory in untrusted workflows)
* Note that cache metadata is not spec'd

Buildpack:
* Add `force-restore` field to buildpack.toml
